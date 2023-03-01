import { readFile } from 'fs/promises';
import { getColoredTimeWatchedStr, parseWithZod, pathJoin, tryCatchAsync } from '../utils.js';
import { HTTP } from '../http.js';
import { writeFileSync } from 'fs';
import {
    ConfigFile,
    ConfigFileSchema,
    LibraryEntries,
    LibraryEntriesSchema,
    LibraryInfoSchema,
    LibraryPatchRespSchema,
    UserData,
    UserDataRequired,
    UserDataRespSchema,
} from './kitsu-schemas.js';
import {
    AuthTokenResp,
    KitsuAuthTokens,
    AnimeCache,
    KitsuConfig,
    LibraryPatchData,
    SerializedAnime,
    KitsuCache,
} from './kitsu-types.js';

type KitsuError = {
    errors: { title: string; detail?: string; status: number }[];
};

const _workingDir = process.cwd();
const _tokenURL = 'https://kitsu.io/api/oauth/token';
const _configFileName = 'wakitsu.json';

let _config = {} as ConfigFile;
let _firstSetup = false;

export class Kitsu {
    static get animeCache(): AnimeCache {
        return _config.cache.slice(0);
    }

    static get isFirstSetup() {
        return _firstSetup;
    }

    static get tokenInfo() {
        return {
            accessToken: _config.access_token,
            refreshToken: _config.refresh_token,
            expires: _config.token_expiration,
        };
    }

    static async init() {
        const [isNew, config] = await tryLoadConfig();
        _firstSetup = isNew;
        _config = config;
        if (!_config.cache.length) {
            const cache = await getAnimeCache();
            _con.info(`;bc;Cached Anime: ;bg;${cache.length}`);
            _config.cache = cache;
            saveConfig(_config);
        }
    }

    static async updateAnime(url: string, data: LibraryPatchData) {
        const resp = await HTTP.patch(new URL(url), JSON.stringify(data), _config.access_token);
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
        const libPatchResp = parseWithZod(
            LibraryPatchRespSchema,
            resolvedData,
            'LibraryPatchResponse'
        );
        return libPatchResp.data.attributes.progress;
    }

    static async rebuildProfile() {
        const stopLoader = _con.printLoader('Fetching Profile Data');
        const userData = await getUserData(_config.username);
        const { time, completed } = userData.stats;
        const { secondsSpentWatching, completedSeries } = _config.stats;

        _config.stats.secondsSpentWatching = time ?? secondsSpentWatching;
        _config.stats.completedSeries = completed ?? completedSeries;
        _config.about = userData.attributes.about;
        saveConfig(_config);
        stopLoader();
        _con.chainInfo(['', `;bc;Profile: ;by;Updated!`]);
    }

    static async findAnime(name: string) {
        const filteredCache: AnimeCache = _config.cache.filter((anime) => {
            const hasCanonTitle = anime[1].toLowerCase().includes(name.toLowerCase());
            const hasEnglishTitle = anime[2].toLowerCase().includes(name.toLowerCase());
            return hasCanonTitle || hasEnglishTitle;
        });
        if (!filteredCache.length) return [];
        const libraryAnimeURL = buildLibraryAnimeURL(filteredCache.map((a) => a[0]));
        const resp = await HTTP.get(libraryAnimeURL);
        const entries = parseWithZod(LibraryEntriesSchema, await resp.json(), 'LibraryEntries');
        return serializeAnimeInfo(filteredCache, entries);
    }

    static async rebuildCache() {
        if (!_config.access_token) {
            _con.error('KitsuAPI not initialized');
            process.exit(1);
        }
        const stopLoader = _con.printLoader('Fetching Kitsu Data');
        const cachedAnime = await getAnimeCache();
        _config.cache = cachedAnime;
        stopLoader();
        _con.info(`;bc;Cache Reloaded: ;by;${cachedAnime.length}`);
    }

    static async refreshToken() {
        const credentials = JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: _config.refresh_token,
        });
        const resp = await HTTP.post(_tokenURL, credentials);
        const data = await tryGetDataFromResp<AuthTokenResp>(resp);
        _config.access_token = data.access_token;
        _config.refresh_token = data.refresh_token;
        _config.token_expiration = data.expires_in + Date.now() / 1000;
        saveConfig(_config);
        _con.chainInfo([`;bc;Config File: ;g;Saved`, '']);
    }

    static displayCacheInfo() {
        _con.chainInfo([
            `;by;Anime Cache Info`,
            `;bc;Cached Anime: ;g;${_config.cache.length}`,
        ]);
        _config.cache.forEach((c) => {
            _con.chainInfo([
                '',
                `;bc;title_jp: ;x;${c[1]}`,
                `;bc;title_en: ;x;${c[2]}`,
                `;bc;Entry: ;y;https://kitsu.io/api/edge/library-entries/${c[0]}`,
            ]);
        });
    }

    static displayUserProfile() {
        const { allTimeStr, hoursAndMinutesLeft } = getColoredTimeWatchedStr(
            _config.stats.secondsSpentWatching
        );
        _con.chainInfo([
            `;by;Current User Profile`,
            `;bc;Name: ;g;${_config.username}`,
            `;bc;About: ;x;${_config.about}`,
            `;bc;Link: ;g;${_config.urls.profile}`,
            `;bc;Watch Time: ;g;${allTimeStr} ;m;or ${hoursAndMinutesLeft}`,
            `;bc;Series Completed: ;g;${_config.stats.completedSeries}`,
        ]);
    }
}

async function tryLoadConfig(): Promise<KitsuConfig> {
    const asyncRes = await tryCatchAsync(readFile(pathJoin(_workingDir, _configFileName)));
    if (!asyncRes.success) {
        if (asyncRes.error.message.includes('ENOENT')) {
            return await trySetupConfig();
        }
        _con.error(asyncRes.error.message);
        process.exit(1);
    }
    const config = parseWithZod(
        ConfigFileSchema,
        JSON.parse(asyncRes.data.toString('utf-8')),
        'Config'
    );
    return [false, config];
}

async function trySetupConfig(): Promise<KitsuConfig> {
    _con.info(`Missing Config -- ;bg;Setup Activated;x;`);
    await tryGetSetupConsent();
    const user = await promptUser();
    if (!areStatsDefined(user)) {
        _con.chainError([
            'Failed to Serialize Config Data',
            `;bc;Stats Undefined: ;by;stats.time ;x;|| ;by;stats.completed`,
        ]);
        process.exit(1);
    }
    const password = await promptPassword();
    const tokens = await getAuthTokens(user.attributes.name, password);
    const config = serializeConfigData(user, tokens);
    saveConfig(config);
    _con.chainInfo(['', `;bc;Config File: ;by;Created`]);
    return [true, config];
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
    const user = parseWithZod(UserDataRespSchema, resolvedResp, 'UserData');
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

async function getAuthTokens(username: string, password: string) {
    const credentials = JSON.stringify({
        grant_type: 'password',
        username: username,
        password: password,
    });
    const resp = await HTTP.post(_tokenURL, credentials);
    const data = await tryGetDataFromResp<AuthTokenResp>(resp);
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
    };
}

function areStatsDefined(data: UserData): data is UserDataRequired {
    return typeof data.stats.time == 'number' && typeof data.stats.completed == 'number';
}

function serializeConfigData(user: UserDataRequired, tokens: KitsuAuthTokens): ConfigFile {
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
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiration: Math.floor(tokens.expires_in + Date.now() / 1000),
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

async function getAnimeCache(): Promise<AnimeCache> {
    const resp = await HTTP.get(getAnimeWatchListURL());
    const library = parseWithZod(LibraryInfoSchema, await resp.json(), 'Library');
    const cache: KitsuCache = [];
    library.included.forEach((anime, i) => {
        cache.push([
            library.data[i].id,
            anime.attributes.canonicalTitle.trim(),
            anime.attributes.titles.en.trim(),
            anime.attributes.episodeCount || 0,
        ]);
    });
    return cache;
}

function getAnimeWatchListURL() {
    const url = new URL(_config.urls.library);
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

function serializeAnimeInfo(cacheList: AnimeCache, entries: LibraryEntries): SerializedAnime[] {
    return cacheList.map((cache, i) => {
        const rating = entries.data[i].attributes.ratingTwenty;
        const avgRating = entries.included[i].attributes.averageRating;
        return {
            title_jp: cache[1],
            title_en: cache[2],
            progress: entries.data[i].attributes.progress,
            rating: rating ? `${(rating / 20) * 10}` : rating,
            totalEpisodes: entries.included[i].attributes.episodeCount,
            avgRating: avgRating
                ? `${(Number(avgRating) / 10).toFixed(2)}`
                : 'Not Calculated Yet',
        };
    });
}

function saveConfig(config: ConfigFile) {
    writeFileSync(pathJoin(_workingDir, _configFileName), JSON.stringify(config, null, 2));
}
