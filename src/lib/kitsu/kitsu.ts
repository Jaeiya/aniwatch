import { getColoredTimeWatchedStr, parseWithZod } from '../utils.js';
import { HTTP } from '../http.js';
import {
    KitsuData,
    LibraryEntries,
    LibraryEntriesSchema,
    LibraryInfoSchema,
    LibraryPatchRespSchema,
    UserData,
    UserDataRequired,
    UserDataRespSchema,
} from './kitsu-schemas.js';
import {
    TokenGrantResp,
    KitsuTokenData,
    AnimeCache,
    LibraryPatchData,
    SerializedAnime,
    KitsuCache,
    KitsuSerializedTokenData,
} from './kitsu-types.js';
import { Config } from '../config.js';

type KitsuError = {
    errors: { title: string; detail?: string; status: number }[];
};

const _tokenURL = 'https://kitsu.io/api/oauth/token';
/** Get Kitsu properties */
const _gK = Config.getKitsuProp;
/** Set Kitsu Properties */
const _sK = Config.setKitsuProp;

export class Kitsu {
    static get animeCache() {
        return _gK('cache').slice(0);
    }

    static get tokenInfo() {
        return {
            accessToken: _gK('access_token'),
            refreshToken: _gK('refresh_token'),
            expires: _gK('token_expiration'),
        };
    }

    static async init() {
        await tryGetSetupConsent();
        const user = await promptUser();
        if (!areStatsDefined(user)) {
            _con.chainError([
                'Failed to Serialize Kitsu Data',
                `;bc;Stats Undefined: ;by;stats.time ;x;|| ;by;stats.completed`,
            ]);
            process.exit(1);
        }
        const password = await promptPassword();
        const tokenData = await grantTokenData(user.attributes.name, password);
        Config.setKitsuData(serializeKitsuData(user, tokenData));
        const animeCache = await getAnimeCache();
        Config.setKitsuProp('cache', animeCache);
    }

    static async updateAnime(url: string, data: LibraryPatchData) {
        const resp = await HTTP.patch(new URL(url), JSON.stringify(data), _gK('access_token'));
        const resolvedData = await resp.json();
        if (!resp.ok) {
            const errData = resolvedData as KitsuError;
            if (errData.errors[0].title == 'Invalid token') {
                _con.chainError(['', ';r;Kitsu API Error', 'Authentication Tokens Expired']);
                process.exit(1);
            }
            const errMessage = errData.errors[0].detail
                ? errData.errors[0].detail
                : errData.errors[0].title;
            _con.chainError(['', `;r;Kitsu API Error`, errMessage]);
            process.exit(1);
        }
        const [error, libPatchResp] = parseWithZod(
            LibraryPatchRespSchema,
            resolvedData,
            'LibraryPatchResponse'
        );
        if (error) {
            _con.chainError(error);
            process.exit(1);
        }
        return libPatchResp.data.attributes.progress;
    }

    static async rebuildProfile() {
        const stopLoader = _con.printLoader('Fetching Profile Data');
        const userData = await getUserData(_gK('username'));
        const { time, completed } = userData.stats;
        const { secondsSpentWatching, completedSeries } = _gK('stats');
        const stats = {
            secondsSpentWatching: time ?? secondsSpentWatching,
            completedSeries: completed ?? completedSeries,
        };
        _sK('about', userData.attributes.about);
        _sK('stats', stats);
        stopLoader();
        _con.info(`;bc;Profile: ;by;Updated!`);
        Config.save();
    }

    static async findAnime(name: string) {
        const filteredCache = _gK('cache').filter((anime) => {
            const hasCanonTitle = anime.jpTitle.toLowerCase().includes(name.toLowerCase());
            const hasEnglishTitle = anime.enTitle.toLowerCase().includes(name.toLowerCase());
            return hasCanonTitle || hasEnglishTitle;
        });
        if (!filteredCache.length) return [];
        const libraryAnimeURL = buildLibraryAnimeURL(filteredCache.map((a) => a.libID));
        const resp = await HTTP.get(libraryAnimeURL);
        const [error, entries] = parseWithZod(
            LibraryEntriesSchema,
            await resp.json(),
            'LibraryEntries'
        );
        if (error) {
            _con.chainError(error);
            process.exit(1);
        }
        return serializeAnimeInfo(filteredCache, entries);
    }

    static async rebuildCache() {
        if (!_gK('access_token')) {
            _con.error('KitsuAPI not initialized');
            process.exit(1);
        }
        const stopLoader = _con.printLoader('Fetching Kitsu Data');
        const cachedAnime = await getAnimeCache();
        _sK('cache', cachedAnime);
        stopLoader();
        _con.info(`;bc;Cache Reloaded: ;by;${cachedAnime.length}`);
        Config.save();
    }

    static async refreshToken() {
        const credentials = JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: _gK('refresh_token'),
        });
        const resp = await HTTP.post(_tokenURL, credentials);
        const tokenResp = await tryGetDataFromResp<TokenGrantResp>(resp);
        saveTokenData(serializeTokenData(tokenResp));
    }

    static async displayCacheInfo() {
        const cache = _gK('cache');
        _con.chainInfo([`;by;Anime Cache Info`, `;bc;Cached Anime: ;g;${cache.length}`]);
        cache.forEach((c) => {
            _con.chainInfo([
                '',
                `;bc;id: ;y;${c.libID}`,
                `;bc;title_jp: ;x;${c.jpTitle}`,
                `;bc;title_en: ;x;${c.enTitle}`,
                `;bc;link: ;x;https://kitsu.io/anime/${c.slug}`,
            ]);
        });
    }

    static displayUserProfile() {
        const stats = _gK('stats');
        const { allTimeStr, hoursAndMinutesLeft } = getColoredTimeWatchedStr(
            stats.secondsSpentWatching
        );
        _con.chainInfo([
            '',
            `;by;Current User Profile`,
            `;bc;Name: ;g;${_gK('username')}`,
            `;bc;About: ;x;${_gK('about')}`,
            `;bc;Link: ;g;${_gK('urls').profile}`,
            `;bc;Watch Time: ;g;${allTimeStr} ;m;or ${hoursAndMinutesLeft}`,
            `;bc;Watching: ;by;${_gK('cache').length} ;g;Series`,
            `;bc;Completed: ;by;${stats.completedSeries} ;g;Series`,
        ]);
    }

    static async resetToken() {
        _con.chainInfo(['', ';bg;Resetting Access Token']);
        const password = await promptPassword();
        const tokenData = await grantTokenData(_gK('username'), password);
        saveTokenData(tokenData);
    }
}

function saveTokenData(data: KitsuSerializedTokenData) {
    _sK('token_expiration', data.token_expiration);
    _sK('access_token', data.access_token);
    _sK('refresh_token', data.refresh_token);
    Config.save();
}

async function tryGetSetupConsent() {
    const hasCreationConsent =
        (await _con.prompt(`;y;Proceed with setup? ;bw;(y/n);x;: ;by;`)) == 'y';
    if (!hasCreationConsent) {
        _con.chainInfo(['', `;by;Setup Aborted`]);
        process.exit(0);
    }
}

async function promptUser(): Promise<UserData> {
    const username = await _con.prompt(`;y;Enter Kitsu username: ;by;`);
    const user = await getUserData(username);
    _con.chainInfo([
        '',
        `;bc;Name: ;g;${user.attributes.name}`,
        `;bc;Profile: ;g;https://kitsu.io/users/${user.attributes.name}`,
        `;bc;About: ;x;${user.attributes.about}`,
    ]);
    const isVerifiedUser = (await _con.prompt(`;y;Is this you? ;bw;(y/n): ;by;`)) == 'y';
    if (!isVerifiedUser) {
        return await promptUser();
    }
    return user;
}

async function getUserData(userName: string) {
    const url = buildUserDataURL(userName);
    const resp = await HTTP.get(url);
    const resolvedResp = await resp.json();
    if (!resolvedResp.data.length) {
        _con.error(`;by;${userName} ;x;not found`);
        process.exit(1);
    }
    const [error, user] = parseWithZod(UserDataRespSchema, resolvedResp, 'UserData');
    if (error) {
        _con.chainError(error);
        process.exit(1);
    }
    return {
        ...user.data[0],
        stats: {
            ...user.included[0].attributes.statsData,
        },
    };
}

function buildUserDataURL(userName: string) {
    const url = new URL('https://kitsu.io/api/edge/users');
    url.searchParams.append('filter[name]', userName);
    url.searchParams.append('include', 'stats');
    return url;
}

async function promptPassword() {
    return await _con.prompt(`;y;Enter password: ;by;`);
}

async function grantTokenData(
    username: string,
    password: string
): Promise<KitsuSerializedTokenData> {
    const credentials = JSON.stringify({
        grant_type: 'password',
        username: username,
        password: password,
    });
    const resp = await HTTP.post(_tokenURL, credentials);
    const tokenResp = await tryGetDataFromResp<TokenGrantResp>(resp);
    return serializeTokenData(tokenResp);
}

function areStatsDefined(data: UserData): data is UserDataRequired {
    return typeof data.stats.time == 'number' && typeof data.stats.completed == 'number';
}

function serializeKitsuData(
    user: UserDataRequired,
    serializedTokenData: KitsuSerializedTokenData
): KitsuData {
    return {
        id: user.id,
        urls: {
            profile: `https://kitsu.io/users/${user.attributes.name}`,
            library: `https://kitsu.io/api/edge/users/${user.id}/library-entries`,
        },
        stats: {
            secondsSpentWatching: user.stats.time,
            completedSeries: user.stats.completed,
        },
        about: user.attributes.about,
        username: user.attributes.name,
        ...serializedTokenData,
        cache: [],
    };
}

async function tryGetDataFromResp<T = unknown>(resp: Response): Promise<T> {
    const data = await resp.json();
    if (!resp.ok) {
        const errorType = data['error'];
        _con.chainError(['', `${errorType}`]);
        if (errorType == 'invalid_grant') {
            _con.error(`;by;Make sure you entered the correct password`);
        }
        _con.error(`${data['error_description']}`);
        process.exit(1);
    }
    return data;
}

async function getAnimeCache() {
    const resp = await HTTP.get(buildAnimeWatchListURL());
    const [error, library] = parseWithZod(LibraryInfoSchema, await resp.json(), 'Library');
    if (error) {
        _con.chainError(error);
        process.exit(1);
    }
    const cache: KitsuCache = [];
    library.included.forEach((anime, i) => {
        cache.push({
            libID: library.data[i].id,
            jpTitle: anime.attributes.canonicalTitle.trim(),
            enTitle: anime.attributes.titles.en.trim(),
            epCount: anime.attributes.episodeCount || 0,
            slug: anime.attributes.slug,
            synopsis: anime.attributes.synopsis,
        });
    });
    return cache;
}

function buildAnimeWatchListURL() {
    const url = new URL(_gK('urls').library);
    url.searchParams.append('filter[status]', 'current');
    url.searchParams.append('page[limit]', '200');
    url.searchParams.append('include', 'anime');
    return url;
}

function buildLibraryAnimeURL(libraryIds: string[]) {
    const url = new URL('https://kitsu.io/api/edge/library-entries');
    url.searchParams.append(
        'filter[id]',
        libraryIds.reduce((pv, cv) => (pv ? `${pv},${cv}` : cv), '')
    );
    url.searchParams.append('include', 'anime');
    url.searchParams.append('fields[anime]', 'episodeCount,averageRating,endDate,startDate');
    url.searchParams.append('page[limit]', '200');
    return url;
}

function serializeAnimeInfo(cacheList: KitsuCache, entries: LibraryEntries): SerializedAnime[] {
    return cacheList.map((cache, i) => {
        const rating = entries.data[i].attributes.ratingTwenty;
        const avgRating = entries.included[i].attributes.averageRating;
        return {
            title_jp: cache.jpTitle,
            title_en: cache.enTitle,
            progress: entries.data[i].attributes.progress,
            rating: rating ? `${(rating / 20) * 10}` : rating,
            totalEpisodes: entries.included[i].attributes.episodeCount,
            avgRating: avgRating
                ? `${(Number(avgRating) / 10).toFixed(2)}`
                : 'Not Calculated Yet',
        };
    });
}

function serializeTokenData(tokenData: KitsuTokenData): KitsuSerializedTokenData {
    return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiration: Math.floor(tokenData.expires_in + Date.now() / 1000),
    };
}
