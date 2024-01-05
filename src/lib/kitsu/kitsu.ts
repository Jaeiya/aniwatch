import { getColoredTimeWatchedStr, getTimeUnits, parseWithZod } from '../utils.js';
import { HTTP } from '../http.js';
import {
    KitsuAnimeEntriesSchema,
    KitsuAnimeInfoEntry,
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
    LibraryPatchData,
    SerializedAnime,
    KitsuCache,
    KitsuSerializedTokenData,
    KitsuCacheItem,
} from './kitsu-types.js';
import { Config } from '../config.js';
import { z } from 'zod';
import { KitsuURLs } from './kitsu-urls.js';
import { Printer } from '../printer/printer.js';

type KitsuError = {
    errors: { title: string; detail?: string; status: number }[];
};

type UpdatedProgress = Promise<
    readonly [progress: number, episodeCount: number | null, tokenExpirationDays: number]
>;

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
            expiresSec: _gK('token_expiration'),
        };
    }

    static async init() {
        await tryGetSetupConsent();
        const user = await promptUser();
        if (!areStatsDefined(user)) {
            Printer.printError(
                `;bc;Stats Undefined: ;by;stats.time ;x;|| ;by;stats.completed`,
                'Serialization Failed'
            );
            process.exit(1);
        }
        const password = await promptPassword();
        const tokenData = await grantTokenData(user.attributes.name, password);
        Config.setKitsuData(serializeKitsuData(user, tokenData));
        const animeCache = await buildAnimeCache();
        Config.setKitsuProp('cache', animeCache);
    }

    static getFileBinding(libID: string) {
        return _gK('fileBindings').find((f) => f.id == libID)?.name;
    }

    static setFileBinding(libID: string, name: string) {
        _gK('fileBindings').push({
            id: libID,
            name,
        });
    }

    static removeFileBinding(libID: string) {
        _sK(
            'fileBindings',
            _gK('fileBindings').filter((fb) => fb.id != libID)
        );
    }

    /**
     * Add anime to Kitsu watch list.
     */
    static async trackAnime(animeID: string) {
        const resp = await HTTP.postAPI(
            'https://kitsu.io/api/edge/library-entries',
            JSON.stringify({
                data: {
                    type: 'library-entries',
                    attributes: { status: 'current' },
                    relationships: {
                        anime: {
                            data: {
                                id: animeID,
                                type: 'anime',
                            },
                        },
                        user: {
                            data: {
                                id: _gK('id'),
                                type: 'users',
                            },
                        },
                    },
                },
            }),
            Config.getKitsuProp('access_token')
        );

        const [error, jsonResp] = parseWithZod(
            z.object({
                data: z.object({
                    id: z.string(),
                }),
            }),
            await resp.json(),
            'AddAnimeScheme'
        );

        if (error) {
            const header = error.shift();
            Printer.printError([...error], header);
            process.exit(1);
        }

        return jsonResp;
    }

    static async dropAnime(libID: string) {
        const resp = await HTTP.patch(
            new URL(`https://kitsu.io/api/edge/library-entries/${libID}`),
            JSON.stringify({
                data: {
                    id: libID,
                    type: 'library-entries',
                    attributes: { status: 'dropped' },
                },
            }),
            Config.getKitsuProp('access_token')
        );

        const json = await resp.json();

        if (json.errors) {
            throw Error(json);
        }

        const [error, jsonResp] = parseWithZod(
            z.object({
                data: z.object({
                    id: z.string(),
                    attributes: z.object({
                        status: z.string(),
                    }),
                }),
            }),
            json,
            'DropAnimeScheme'
        );

        if (error) {
            const header = error.shift();
            Printer.printError([...error], header);
            process.exit(1);
        }

        return jsonResp;
    }

    static async updateAnime(url: string, data: LibraryPatchData): UpdatedProgress {
        const urlObj = new URL(url);
        urlObj.searchParams.append('include', 'anime');
        urlObj.searchParams.append('fields[anime]', 'episodeCount');

        const tokenExpiresIn = Math.floor(
            getTimeUnits(Kitsu.tokenInfo.expiresSec - Date.now() / 1000).days
        );

        const resp = await HTTP.patch(urlObj, JSON.stringify(data), _gK('access_token'));
        const resolvedData = await resp.json();

        if (!resp.ok) {
            const errData = resolvedData as KitsuError;
            if (errData.errors[0].title == 'Invalid token') {
                Printer.printError('Authentication Token Expired', 'API Error');
                process.exit(1);
            }
            const errMessage = errData.errors[0].detail
                ? errData.errors[0].detail
                : errData.errors[0].title;
            Printer.printError(errMessage, 'API Error');
            process.exit(1);
        }

        const [error, libPatchResp] = parseWithZod(
            LibraryPatchRespSchema,
            resolvedData,
            'LibraryPatchResponse'
        );

        if (error) {
            const header = error.shift();
            Printer.printError([...error], header);
            process.exit(1);
        }

        return [
            libPatchResp.data.attributes.progress,
            libPatchResp.included[0].attributes.episodeCount,
            tokenExpiresIn,
        ] as const;
    }

    static removeAnimeFromCache(cachedItem: KitsuCacheItem, opt = { saveConfig: true }) {
        _sK(
            'cache',
            _gK('cache').filter((anime) => anime.libID != cachedItem.libID)
        );
        this.removeFileBinding(cachedItem.libID);
        if (opt.saveConfig) {
            Config.save();
        }
        return true;
    }

    static async rebuildProfile() {
        const user = await getUserData(_gK('username'));
        if (!user) {
            return false;
        }
        const { time, completed } = user.stats;
        const { secondsSpentWatching, completedSeries } = _gK('stats');
        const stats = {
            secondsSpentWatching: time ?? secondsSpentWatching,
            completedSeries: completed ?? completedSeries,
        };
        _sK('about', user.attributes.about);
        _sK('stats', stats);
        Config.save();
        return true;
    }

    static async findAnime(name: string, status: 'current' | 'finished') {
        const resp = await HTTP.get(KitsuURLs.getAnimeInfoURL(name, status));
        const jsonResp = await resp.json();
        const [error, entries] = parseWithZod(
            KitsuAnimeEntriesSchema,
            jsonResp,
            'AnimeEntries'
        );
        if (error) {
            const header = error.shift();
            Printer.printError([...error], header);
            process.exit(1);
        }
        return serializeAnimeInfo(entries.data);
    }

    static async findLibraryAnime(name: string) {
        const filteredCache = _gK('cache').filter((anime) => {
            const hasCanonTitle = anime.jpTitle.toLowerCase().includes(name.toLowerCase());
            const hasEnglishTitle = anime.enTitle
                ? anime.enTitle.toLowerCase().includes(name.toLowerCase())
                : false;
            const hasAltTitle = anime.synonyms.some((s) => s.toLowerCase().includes(name));
            return hasCanonTitle || hasEnglishTitle || hasAltTitle;
        });
        if (!filteredCache.length) return [];
        const libraryAnimeURL = KitsuURLs.getLibraryAnimeInfoURL(
            filteredCache.map((a) => a.libID)
        );
        const resp = await HTTP.get(libraryAnimeURL);
        const [error, entries] = parseWithZod(
            LibraryEntriesSchema,
            await resp.json(),
            'LibraryEntries'
        );
        if (error) {
            const header = error.shift();
            Printer.printError([...error], header);
            process.exit(1);
        }
        return serializeLibraryAnimeInfo(filteredCache, entries);
    }

    static findCachedAnime(
        title: string
    ): Array<[CachedAnime: KitsuCacheItem, CacheIndex: number]> {
        const lowerTitle = title.toLowerCase();
        const cachedAnime: Array<[KitsuCacheItem, number]> = [];

        for (let i = 0; i < Kitsu.animeCache.length; i++) {
            const a = Kitsu.animeCache[i];
            const isCached =
                a.jpTitle.toLowerCase().includes(lowerTitle) ??
                a.enTitle?.toLowerCase().includes(lowerTitle) ??
                a.synonyms.some((s) => s.toLowerCase().includes(lowerTitle));

            if (isCached) {
                cachedAnime.push([a, i]);
            }
        }

        return cachedAnime;
    }

    static async rebuildCache() {
        const cachedAnime = await buildAnimeCache();
        _sK('cache', cachedAnime);
        Config.save();
        return { cachedAnimeCount: cachedAnime.length };
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

    static displayUserProfile() {
        const stats = _gK('stats');
        const { allTimeStr, hoursAndMinutesLeft } = getColoredTimeWatchedStr(
            stats.secondsSpentWatching
        );
        Printer.print([
            null,
            ['h3', ['User Profile']],
            null,
            ['py', ['Name', `${_gK('username')}`], 6],
            ['py', ['About', `${_gK('about')}`], 5],
            ['', `;c;Link: ;g;${_gK('urls').profile}`, 9],
            ['py', ['Watch Time', `${allTimeStr} ;m;or ${hoursAndMinutesLeft}`]],
            ['py', ['Watching', `;y;${_gK('cache').length} ;g;Series`], 2],
            ['py', ['Time Left', `;y;${toWatchTimeLeft(_gK('cache'))}`], 1],
            ['py', ['Completed', `;y;${stats.completedSeries} ;g;Series`], 1],
            null,
        ]);
    }

    static async resetToken() {
        Printer.print([
            null,
            null,
            [
                'p',
                'You will need to provide your ;x;Kitsu.io ;bk;password so that we can ' +
                    'reset your ;x;Access Token;bk;. You only need to do this if your ' +
                    ';x;Access Token ;bk;is about to ;m;expire;bk;. You can check this\n' +
                    'by typing the following command:',
            ],
            null,
            ['p', ';by;wak ;bc;-t ;y;info'],
            null,
        ]);
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
    const hasSetupConsent = await Printer.promptYesNo(`Proceed with setup`);
    if (!hasSetupConsent) {
        Printer.printWarning('You have decided not to consent', 'Setup Aborted');
        process.exit(0);
    }
}

async function promptUser(): Promise<UserData> {
    const username = await Printer.prompt(`Enter Kitsu username:`);
    const user = await getUserData(username);
    if (!user) {
        Printer.printError(`;c;${username};y; not found`);
        return await promptUser();
    }
    Printer.print([
        null,
        ['py', ['Name', `${user.attributes.name}`], 3],
        ['py', ['Profile', `;g;https://kitsu.io/users/${user.attributes.name}`]],
        ['py', ['About', `${user.attributes.about}`], 2],
        null,
    ]);
    const isVerifiedUser = await Printer.promptYesNo(`Is the above info correct`);
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
        return null;
    }
    const [error, user] = parseWithZod(UserDataRespSchema, resolvedResp, 'UserData');
    if (error) {
        const header = error.shift();
        Printer.printError([...error], header);
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
    return await Printer.prompt(`Enter password:`);
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
        fileBindings: [],
        cache: [],
    };
}

async function tryGetDataFromResp<T = unknown>(resp: Response): Promise<T> {
    const data = await resp.json();
    if (!resp.ok) {
        const header = data['error'];
        Printer.printError(
            [
                data['error_description'],
                '',
                ';bc;... ;y;Possible Issues ;bc;...',
                '(;bc;1;y;) ;c;Make sure you entered the correct password.',
            ],
            header
        );
        process.exit(1);
    }
    return data;
}

async function buildAnimeCache() {
    const resp = await HTTP.get(KitsuURLs.getWatchListURL());
    const [error, library] = parseWithZod(LibraryInfoSchema, await resp.json(), 'Library');
    if (error) {
        const header = error.shift();
        Printer.printError([...error], header);
        process.exit(1);
    }
    const cache: KitsuCache = [];
    library.included.forEach((anime, i) => {
        cache.push({
            libID: library.data[i].id,
            jpTitle: anime.attributes.canonicalTitle.trim(),
            enTitle: anime.attributes.titles.en ? anime.attributes.titles.en.trim() : '',
            epCount: anime.attributes.episodeCount ?? 0,
            epProgress: library.data[i].attributes.progress || 0,
            synonyms: anime.attributes.abbreviatedTitles,
            // There's a flaw in Kitsu's slugging algorithm
            slug: anime.attributes.slug.replaceAll(' ', '%20'),
        });
    });
    return cache;
}

function serializeAnimeInfo(entries: KitsuAnimeInfoEntry[]) {
    return entries.map((entry) => ({
        id: entry.id,
        jpTitle: entry.attributes.titles.en_jp,
        enTitle: entry.attributes.titles.en,
        usTitle: entry.attributes.titles.en_us,
        synonyms: entry.attributes.abbreviatedTitles,
        epCount: entry.attributes.episodeCount ?? 0,
        // There's a flaw in Kitsu's slugging algorithm
        slug: `${entry.attributes.slug.replaceAll(' ', '%20')}`,
        synopsis: entry.attributes.synopsis ?? '',
        avgRating: entry.attributes.averageRating
            ? `${(Number(entry.attributes.averageRating) / 10).toFixed(2)}`
            : 'Not Calculated Yet',
    }));
}

function serializeLibraryAnimeInfo(
    cacheList: KitsuCache,
    entries: LibraryEntries
): SerializedAnime[] {
    return cacheList.map((cache, i) => {
        const rating = entries.data[i].attributes.ratingTwenty;
        const avgRating = entries.included[i].attributes.averageRating;
        const anime: SerializedAnime = {
            title_jp: cache.jpTitle,
            title_en: cache.enTitle ? cache.enTitle : '',
            synonyms: cache.synonyms,
            epProgress: entries.data[i].attributes.progress,
            rating: rating ? `${(rating / 20) * 10}` : rating,
            epCount: entries.included[i].attributes.episodeCount,
            synopsis: entries.included[i].attributes.synopsis,
            link: `https://kitsu.io/anime/${cache.slug}`,
            avgRating: avgRating
                ? `${(Number(avgRating) / 10).toFixed(2)}`
                : 'Not Calculated Yet',
        };
        return anime;
    });
}

function serializeTokenData(tokenData: KitsuTokenData): KitsuSerializedTokenData {
    return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiration: Math.floor(tokenData.expires_in + Date.now() / 1000),
    };
}

function toWatchTimeLeft(cache: KitsuCache) {
    const episodesLeft = cache.reduce(
        (pv, cv) => (cv.epCount > 0 ? pv + (cv.epCount - cv.epProgress) : pv),
        0
    );
    const timeLeft = getTimeUnits(episodesLeft * 24 * 60);
    return timeLeft.hours > 2
        ? `${timeLeft.hours.toFixed(0)} ;g;hours, ;y;${Math.ceil(
              (timeLeft.hours % 1) * 60
          )} ;g;Minutes`
        : `${timeLeft.minutes} Minutes`;
}
