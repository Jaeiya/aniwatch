import { readFile } from 'fs/promises';
import { Logger } from '../logger.js';
import { displayZodErrors, pathJoin, tryCatchAsync } from '../utils.js';
import { HTTP } from '../http.js';
import { existsSync, writeFileSync } from 'fs';
import {
  AnimeCache,
  ConfigFile,
  LibraryEntriesSchema,
  LibraryInfo,
  LibraryPatchRespData,
  UserData,
  UserDataResp,
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

type CachedAnime = [libID: string, cannonTitle: string, englishTitle: string][];

const _workingDir = process.cwd();
const _cc = Logger.consoleColors;
const _tokenURL = 'https://kitsu.io/api/oauth/token';
const _prompt = Logger.prompt;

export class KitsuAPI {
  #config = {} as ConfigFile;
  #animeCache: CachedAnime = [];
  #firstSetup = false;

  get animeCache() {
    return this.#animeCache.slice(0);
  }

  get isFirstSetup() {
    return this.#firstSetup;
  }

  get #activeAnimeFilterURL() {
    const url = new URL(this.#config.urls.library);
    url.searchParams.append('filter[status]', 'current');
    url.searchParams.append('page[limit]', '200');
    url.searchParams.append('include', 'anime');
    return url;
  }

  async init() {
    this.#config = await this.#tryLoadConfig();
    this.#animeCache = await this.#tryLoadAnimeCache();
  }

  displayCacheInfo() {
    const cache = this.animeCache;
    Logger.chainInfo([
      `${_cc.byw}Anime Cache Info`,
      `${_cc.bcn}Cached Anime: ${_cc.gn}${cache.length}`,
    ]);
    cache.forEach((c) => {
      Logger.chainInfo([
        '',
        `${_cc.bcn}title_jp:${_cc.x} ${c[1]}`,
        `${_cc.cn}title_en:${_cc.x} ${c[2]}`,
        `${_cc.bcn}Entry:${_cc.x} ${_cc.yw}https://kitsu.io/api/edge/library-entries/${c[0]}`,
      ]);
    });
  }

  displayUserProfile() {
    Logger.chainInfo([
      `${_cc.byw}Current User Profile`,
      `${_cc.bcn}Name:${_cc.x}${_cc.gn} ${this.#config.username}`,
      `${_cc.bcn}About:${_cc.x} ${this.#config.about}`,
      `${_cc.bcn}Link:${_cc.x}${_cc.gn} ${this.#config.urls.profile}`,
      `${_cc.bcn}Watch Time:${_cc.x}${_cc.gn} ${this.#getTimeWatchedStr()}`,
      `${_cc.bcn}Series Completed:${_cc.x}${_cc.gn} ${
        this.#config.stats.completedSeries
      }`,
    ]);
  }

  async updateAnime(url: string, data: LibraryPatchData) {
    const resp = await HTTP.patch(
      new URL(url),
      JSON.stringify(data),
      this.#config.access_token
    );
    const resolvedData = await resp.json();
    if (resp.status > 200) {
      Logger.chainError([
        '',
        `${_cc.rd}Kitsu API Error`,
        resolvedData['errors'][0]['detail'],
      ]);
      process.exit(1);
    }
    const libData = LibraryPatchRespData.safeParse(resolvedData);
    if (!libData.success) {
      console.log(resolvedData);
      displayZodErrors(libData.error, 'Failed Parsing Library Patch Response');
      process.exit(1);
    }
    Logger.info(
      `${_cc.bcn}Progress Set:${_cc.x} ${_cc.byw}${libData.data.data.attributes.progress}`
    );
  }

  async findAnime(name: string) {
    const animeList: string[][] = [];
    this.#animeCache.forEach((anime) => {
      const hasCanonTitle = anime[1].toLowerCase().includes(name.toLowerCase());
      const hasEnglishTitle = anime[2].toLowerCase().includes(name.toLowerCase());
      if (hasCanonTitle || hasEnglishTitle) {
        animeList.push([...anime]);
      }
    });
    const libraryURL = new URL('https://kitsu.io/api/edge/library-entries');
    libraryURL.searchParams.append(
      'filter[id]',
      animeList.reduce((pv, cv) => {
        return pv ? `${pv},${cv[0]}` : cv[0];
      }, '')
    );
    libraryURL.searchParams.append('include', 'anime');
    libraryURL.searchParams.append(
      'fields[anime]',
      'episodeCount,averageRating,endDate,startDate'
    );
    const resp = await HTTP.get(libraryURL);
    const zodResp = LibraryEntriesSchema.safeParse(await resp.json());
    if (!zodResp.success) {
      displayZodErrors(zodResp.error, 'Failed To Parse Library Entries');
      process.exit(1);
    }
    return animeList.map((anime, i) => {
      const rating = zodResp.data.data[i].attributes.ratingTwenty;
      const avgRating = zodResp.data.included[i].attributes.averageRating;
      return {
        title_jp: anime[1],
        title_en: anime[2],
        progress: zodResp.data.data[i].attributes.progress,
        rating: rating ? `${(rating / 20) * 10}` : rating,
        totalEpisodes: zodResp.data.included[i].attributes.episodeCount,
        avgRating: avgRating
          ? `${(Number(avgRating) / 10).toFixed(2)}`
          : 'Not Calculated Yet',
      };
    });
  }

  async rebuildCache() {
    if (!this.#config.access_token) {
      Logger.error('KitsuAPI not initialized');
      process.exit(1);
    }
    const cachedAnime = await this.#populateCurrentAnimeCache();
    this.#animeCache = cachedAnime;
    Logger.info(`${_cc.bcn}Cache Reloaded: ${_cc.byw}${cachedAnime.length}`);
  }

  async #tryLoadAnimeCache() {
    if (!existsSync(pathJoin(_workingDir, '.aniwatch.cache'))) {
      const animeCache = await this.#populateCurrentAnimeCache();
      Logger.info(`${_cc.bcn}Cached Anime: ${_cc.bgn}${animeCache.length}`);
      return animeCache;
    }
    const zodResp = AnimeCache.safeParse(
      JSON.parse(
        (await readFile(pathJoin(_workingDir, '.aniwatch.cache'))).toString('utf-8')
      )
    );
    if (!zodResp.success) {
      displayZodErrors(zodResp.error, 'Invalid Anime Cache');
      process.exit(1);
    }
    return zodResp.data;
  }

  async #populateCurrentAnimeCache(): Promise<CachedAnime> {
    const resp = await HTTP.get(this.#activeAnimeFilterURL);
    const zodResp = LibraryInfo.safeParse(await resp.json());
    if (!zodResp.success) {
      displayZodErrors(zodResp.error, 'Library Parse Failed');
      process.exit(1);
    }
    const cache: AnimeCache = [];
    zodResp.data.included.forEach((anime, i) => {
      cache.push([
        zodResp.data.data[i].id,
        anime.attributes.canonicalTitle.trim(),
        anime.attributes.titles.en.trim(),
      ]);
    });
    this.#saveCache(cache);
    return cache;
  }

  async #getUserData(name: string) {
    const url = new URL('https://kitsu.io/api/edge/users');
    url.searchParams.append('filter[name]', name);
    url.searchParams.append('include', 'stats');
    const resp = await HTTP.get(url);
    const zodResp = UserDataResp.safeParse(await resp.json());
    if (!zodResp.success) {
      displayZodErrors(zodResp.error, 'User Data Failed to Parse');
      process.exit(1);
    }
    if (!zodResp.data.data.length) {
      Logger.error(`${_cc.byw}${name}${_cc.x} not found`);
      process.exit(1);
    }
    return {
      ...zodResp.data.data[0],
      stats: {
        ...zodResp.data.included[0].attributes.statsData,
      },
    };
  }

  async #getAuthTokens(username: string, password: string) {
    const credentials = JSON.stringify({
      grant_type: 'password',
      username: username,
      password: password,
    });
    const resp = await HTTP.post(_tokenURL, credentials);
    const data = await this.#tryGetDataFromResp<AuthTokenResp>(resp);
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  }

  async refreshToken() {
    const credentials = JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: this.#config.refresh_token,
    });
    const resp = await HTTP.post(_tokenURL, credentials);
    const data = await this.#tryGetDataFromResp<AuthTokenResp>(resp);
    this.#config.access_token = data.access_token;
    this.#config.refresh_token = data.refresh_token;
    this.#saveConfig(this.#config);
    Logger.chainInfo([
      `${_cc.bcn}Config File: ${_cc.byw}Saved`,
      `Refreshed Access Token: ${data.access_token}`,
    ]);
  }

  async #tryGetDataFromResp<T = unknown>(resp: Response) {
    const data = await resp.json();
    if (resp.status > 200) {
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

  async #tryLoadConfig() {
    const configResp = await tryCatchAsync(
      readFile(pathJoin(_workingDir, 'aniwatch.json'))
    );
    if (configResp instanceof Error) {
      if (configResp.message.includes('ENOENT')) {
        Logger.info(`Missing Config -- ${_cc.bgn}Setup Activated${_cc.x}`);
        return await this.#trySetupConfig();
      }
      Logger.error(configResp.message);
      process.exit(1);
    }
    const zodRes = ConfigFile.safeParse(JSON.parse(configResp.toString('utf-8')));
    if (!zodRes.success) {
      displayZodErrors(zodRes.error, 'Config Files Errors');
      process.exit(1);
    }
    return zodRes.data;
  }

  async #trySetupConfig() {
    const hasCreationConsent =
      (await _prompt(
        `${_cc.yw}Proceed with setup? ${_cc.bwt}(y/n)${_cc.x}:${_cc.byw} `
      )) == 'y';
    if (!hasCreationConsent) {
      Logger.chainInfo(['', `${_cc.byw}Setup Aborted`]);
      process.exit(0);
    }
    const user = await this.#promptUser();
    const password = await this.#promptPassword();
    const tokens = await this.#getAuthTokens(user.attributes.name, password);
    const configFile = this.#serializeConfigData(user, tokens);
    this.#saveConfig(configFile);
    Logger.chainInfo(['', `${_cc.bcn}Config File:${_cc.x} ${_cc.byw}Created`]);
    this.#firstSetup = true;
    return configFile;
  }

  #serializeConfigData(user: UserData, tokens: AuthTokens) {
    if (!user.stats.time || !user.stats.completed) {
      Logger.chainError([
        'Failed to Serialize Config Data',
        `${_cc.bcn}Stats Undefined: ${_cc.byw}stats.time${_cc.x} || ${_cc.byw}stats.completed`,
      ]);
      process.exit(1);
    }
    const configFile: ConfigFile = {
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
    };
    return configFile;
  }

  async #promptUser(): Promise<UserData> {
    const username = await _prompt(`${_cc.yw}Enter Kitsu username:${_cc.byw} `);
    const user = await this.#getUserData(username);
    Logger.chainInfo([
      '',
      `${_cc.bcn}Name: ${_cc.gn}${user.attributes.name}`,
      `${_cc.bcn}Profile: ${_cc.gn}https://kitsu.io/users/${user.attributes.name}`,
      `${_cc.bcn}About: ${_cc.x}${user.attributes.about}`,
    ]);
    const isVerifiedUser =
      (await _prompt(`${_cc.yw}Is this you? ${_cc.bwt}(y/n):${_cc.byw} `)) == 'y';
    if (!isVerifiedUser) {
      return await this.#promptUser();
    }
    return user;
  }

  async #promptPassword() {
    return await _prompt(`${_cc.yw}Enter password:${_cc.byw} `);
  }

  #saveConfig(config: ConfigFile) {
    writeFileSync(
      pathJoin(_workingDir, 'aniwatch.json'),
      JSON.stringify(config, null, 2)
    );
  }

  #saveCache(cache: AnimeCache) {
    writeFileSync(pathJoin(_workingDir, '.aniwatch.cache'), JSON.stringify(cache));
  }

  #getTimeWatchedStr() {
    const hoursWatchingAnime = this.#config.stats.secondsSpentWatching / 60 / 60;
    const daysWatchingAnime = hoursWatchingAnime / 24;
    const monthsWatchingAnime = daysWatchingAnime / 30;
    return monthsWatchingAnime >= 1
      ? monthsWatchingAnime.toFixed(1) + ' Months'
      : daysWatchingAnime >= 1
      ? daysWatchingAnime.toFixed(1) + ' Days'
      : hoursWatchingAnime.toFixed(1) + ' Hours';
  }
}
