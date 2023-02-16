import { readFile } from 'fs/promises';
import { Logger } from '../logger.js';
import {
  getColoredTimeWatchedStr,
  parseWithZod,
  pathJoin,
  tryCatchAsync,
} from '../utils.js';
import { HTTP } from '../http.js';
import { existsSync, writeFileSync } from 'fs';
import {
  AnimeCache,
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

type AuthTokenResp = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
};
type AuthTokens = Pick<AuthTokenResp, 'access_token'> &
  Pick<AuthTokenResp, 'refresh_token'>;

type LibraryPatchData = {
  data: {
    id: string;
    type: 'library-entries';
    attributes: {
      progress: number;
    };
  };
};

export type SerializedAnime = {
  title_jp: string;
  title_en: string;
  progress: number;
  rating: string | number | null;
  totalEpisodes: number | null;
  avgRating: string;
};

export type CachedAnime = [
  libraryID: string,
  cannonTitle: string,
  englishTitle: string,
  episodeCount: number
][];

const _workingDir = process.cwd();
const _cc = Logger.consoleColors;
const _tokenURL = 'https://kitsu.io/api/oauth/token';
const _prompt = Logger.prompt;

let _config = {} as ConfigFile;
let _firstSetup = false;

export class Kitsu {
  static get animeCache() {
    return _config.cache.slice(0);
  }

  static get isFirstSetup() {
    return _firstSetup;
  }

  static async init() {
    _config = await tryLoadConfig();
    if (!_config.cache.length) {
      const cache = await getAnimeCache();
      Logger.info(`${_cc.bcn}Cached Anime: ${_cc.bgn}${cache.length}`);
      _config.cache = cache;
      saveConfig(_config);
    }
  }

  static async updateAnime(url: string, data: LibraryPatchData) {
    const resp = await HTTP.patch(
      new URL(url),
      JSON.stringify(data),
      _config.access_token
    );
    const resolvedData = await resp.json();
    if (!resp.ok) {
      Logger.chainError([
        '',
        `${_cc.rd}Kitsu API Error`,
        resolvedData['errors'][0]['detail'],
      ]);
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
    const userData = await getUserData(_config.username);
    const { time, completed } = userData.stats;
    const { secondsSpentWatching, completedSeries } = _config.stats;

    _config.stats.secondsSpentWatching = time ?? secondsSpentWatching;
    _config.stats.completedSeries = completed ?? completedSeries;
    _config.about = userData.attributes.about;
    saveConfig(_config);
    Logger.chainInfo(['', `${_cc.bcn}Profile: ${_cc.byw}Updated!`]);
  }

  static async findAnime(name: string) {
    const filteredCache = _config.cache.filter((anime) => {
      const hasCanonTitle = anime[1].toLowerCase().includes(name.toLowerCase());
      const hasEnglishTitle = anime[2].toLowerCase().includes(name.toLowerCase());
      return hasCanonTitle || hasEnglishTitle;
    });
    if (!filteredCache.length) return [];
    const libraryAnimeURL = buildLibraryAnimeURL(filteredCache.map((a) => a[0]));
    const resp = await HTTP.get(libraryAnimeURL);
    const entries = parseWithZod(
      LibraryEntriesSchema,
      await resp.json(),
      'LibraryEntries'
    );
    return serializeAnimeInfo(filteredCache, entries);
  }

  static async rebuildCache() {
    if (!_config.access_token) {
      Logger.error('KitsuAPI not initialized');
      process.exit(1);
    }
    const cachedAnime = await getAnimeCache();
    _config.cache = cachedAnime;
    Logger.info(`${_cc.bcn}Cache Reloaded: ${_cc.byw}${cachedAnime.length}`);
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
    saveConfig(_config);
    Logger.chainInfo([
      `${_cc.bcn}Config File: ${_cc.gn}Saved`,
      `${_cc.bcn}New Token: ${_cc.gn}${data.access_token}`,
    ]);
  }

  static displayCacheInfo() {
    Logger.chainInfo([
      `${_cc.byw}Anime Cache Info`,
      `${_cc.bcn}Cached Anime: ${_cc.gn}${_config.cache.length}`,
    ]);
    _config.cache.forEach((c) => {
      Logger.chainInfo([
        '',
        `${_cc.bcn}title_jp:${_cc.x} ${c[1]}`,
        `${_cc.cn}title_en:${_cc.x} ${c[2]}`,
        `${_cc.bcn}Entry:${_cc.x} ${_cc.yw}https://kitsu.io/api/edge/library-entries/${c[0]}`,
      ]);
    });
  }

  static displayUserProfile() {
    const { allTimeStr, hoursAndMinutesLeft } = getColoredTimeWatchedStr(
      _config.stats.secondsSpentWatching
    );
    Logger.chainInfo([
      `${_cc.byw}Current User Profile`,
      `${_cc.bcn}Name:${_cc.x}${_cc.gn} ${_config.username}`,
      `${_cc.bcn}About:${_cc.x} ${_config.about}`,
      `${_cc.bcn}Link:${_cc.x}${_cc.gn} ${_config.urls.profile}`,
      `${_cc.bcn}Watch Time:${_cc.x}${_cc.gn} ${allTimeStr} or ${hoursAndMinutesLeft}`,
      `${_cc.bcn}Series Completed:${_cc.x}${_cc.gn} ${_config.stats.completedSeries}`,
    ]);
  }
}

async function tryLoadConfig() {
  const configResp = await tryCatchAsync(
    readFile(pathJoin(_workingDir, 'aniwatch.json'))
  );
  if (configResp instanceof Error) {
    if (configResp.message.includes('ENOENT')) {
      return await trySetupConfig();
    }
    Logger.error(configResp.message);
    process.exit(1);
  }
  const config = parseWithZod(
    ConfigFileSchema,
    JSON.parse(configResp.toString('utf-8')),
    'Config'
  );
  return config;
}

async function trySetupConfig() {
  Logger.info(`Missing Config -- ${_cc.bgn}Setup Activated${_cc.x}`);
  await tryGetSetupConsent();
  const user = await promptUser();
  if (!areStatsDefined(user)) {
    Logger.chainError([
      'Failed to Serialize Config Data',
      `${_cc.bcn}Stats Undefined: ${_cc.byw}stats.time${_cc.x} || ${_cc.byw}stats.completed`,
    ]);
    process.exit(1);
  }
  const password = await promptPassword();
  const tokens = await getAuthTokens(user.attributes.name, password);
  const configFile = serializeConfigData(user, tokens);
  saveConfig(configFile);
  Logger.chainInfo(['', `${_cc.bcn}Config File:${_cc.x} ${_cc.byw}Created`]);
  _firstSetup = true;
  return configFile;
}

async function tryGetSetupConsent() {
  const hasCreationConsent =
    (await _prompt(`${_cc.yw}Proceed with setup? ${_cc.bwt}(y/n)${_cc.x}:${_cc.byw} `)) ==
    'y';
  if (!hasCreationConsent) {
    Logger.chainInfo(['', `${_cc.byw}Setup Aborted`]);
    process.exit(0);
  }
}

async function promptUser(): Promise<UserData> {
  const username = await _prompt(`${_cc.yw}Enter Kitsu username:${_cc.byw} `);
  const user = await getUserData(username);
  Logger.chainInfo([
    '',
    `${_cc.bcn}Name: ${_cc.gn}${user.attributes.name}`,
    `${_cc.bcn}Profile: ${_cc.gn}https://kitsu.io/users/${user.attributes.name}`,
    `${_cc.bcn}About: ${_cc.x}${user.attributes.about}`,
  ]);
  const isVerifiedUser =
    (await _prompt(`${_cc.yw}Is this you? ${_cc.bwt}(y/n):${_cc.byw} `)) == 'y';
  if (!isVerifiedUser) {
    return await promptUser();
  }
  return user;
}

async function getUserData(userName: string) {
  const url = buildUserDataURL(userName);
  const resp = await HTTP.get(url);
  const user = parseWithZod(UserDataRespSchema, await resp.json(), 'UserData');
  if (!user.data.length) {
    Logger.error(`${_cc.byw}${userName}${_cc.x} not found`);
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
  return await _prompt(`${_cc.yw}Enter password:${_cc.byw} `);
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
  };
}

function areStatsDefined(data: UserData): data is UserDataRequired {
  return typeof data.stats.time == 'number' && typeof data.stats.completed == 'number';
}

function serializeConfigData(user: UserDataRequired, tokens: AuthTokens): ConfigFile {
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
    ...tokens,
    cache: [],
  };
}

async function tryGetDataFromResp<T = unknown>(resp: Response) {
  const data = await resp.json();
  if (!resp.ok) {
    const errorType = data['error'];
    Logger.chainError(['', `${errorType}`]);
    if (errorType == 'invalid_grant') {
      Logger.error(`${_cc.byw}Make sure you entered the correct password`);
    }
    Logger.error(`${data['error_description']}`);
    process.exit(1);
  }
  return data as T;
}

async function getAnimeCache(): Promise<CachedAnime> {
  const resp = await HTTP.get(getAnimeWatchListURL());
  const library = parseWithZod(LibraryInfoSchema, await resp.json(), 'Library');
  const cache: AnimeCache = [];
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
  url.searchParams.append(
    'fields[anime]',
    'episodeCount,averageRating,endDate,startDate'
  );
  url.searchParams.append('page[limit]', '200');
  return url;
}

function serializeAnimeInfo(
  cacheList: CachedAnime,
  entries: LibraryEntries
): SerializedAnime[] {
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
  writeFileSync(pathJoin(_workingDir, 'aniwatch.json'), JSON.stringify(config, null, 2));
}
