import { readFile } from 'fs/promises';
import { Logger } from './logger.js';
import { pathJoin, tryCatchAsync } from './utils.js';
import { z, ZodError } from 'zod';
import { HTTP } from './http.js';
import { existsSync, writeFileSync } from 'fs';
import { CLI } from './cli.js';

type AuthTokenResp = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
};

type UserDataResp = z.infer<typeof UserDataResp>;
const UserDataResp = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        name: z.string(),
        about: z.string(),
      }),
    })
  ),
  included: z.array(
    z.object({
      attributes: z.object({
        statsData: z.object({
          time: z.number().optional(),
          completed: z.number().optional(),
        }),
      }),
    })
  ),
});
type UserData = UserDataResp['data'][0] & {
  stats: UserDataResp['included'][0]['attributes']['statsData'];
};

type ConfigFile = z.infer<typeof ConfigFile>;
const ConfigFile = z.object({
  id: z.string(),
  urls: z.object({
    profile: z.string(),
    library: z.string(),
  }),
  stats: z.object({
    secondsSpentWatching: z.number(),
    completedSeries: z.number(),
  }),
  about: z.string(),
  username: z.string(),
  password: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
});

const LibraryInfo = z.object({
  data: z.array(
    z.object({
      id: z.string(),
    })
  ),
  included: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        titles: z.object({
          en: z.string(),
          en_jp: z.string(),
        }),
        canonicalTitle: z.string(),
      }),
    })
  ),
});

const LibraryPatchRespData = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      progress: z.number(),
    }),
  }),
});

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
type AnimeCache = z.infer<typeof AnimeCache>;
const AnimeCache = z.array(z.tuple([z.string(), z.string(), z.string()]));

const _workingDir = process.cwd();
const _cc = Logger.consoleColors;
const _tokenURL = 'https://kitsu.io/api/oauth/token';

export class KitsuAPI {
  #config = {} as ConfigFile;
  #animeCache: CachedAnime = [];

  get animeCache() {
    return this.#animeCache.slice(0);
  }

  async init() {
    this.#config = await this.#tryLoadConfig();
    this.#animeCache = await this.#tryLoadAnimeCache();
  }

  displayCacheInfo() {
    const cache = this.animeCache;
    Logger.info(`${_cc.byw}Anime Cache Info`);
    Logger.info(`${_cc.bcn}Cached Anime: ${_cc.gn}${cache.length}`);
    cache.forEach((c) => {
      console.log('');
      Logger.info(`${_cc.bcn}title_jp:${_cc.x} ${c[1]}`);
      Logger.info(`${_cc.cn}title_en:${_cc.x} ${c[2]}`);
      Logger.info(
        `${_cc.bcn}Entry:${_cc.x} ${_cc.yw}https://kitsu.io/api/edge/library-entries/${c[0]}`
      );
    });
  }

  displayUserProfile() {
    Logger.info(`${_cc.byw}Current User Profile`);
    Logger.info(`${_cc.bcn}Name:${_cc.x}${_cc.gn} ${this.#config.username}`);
    Logger.info(`${_cc.bcn}About:${_cc.x} ${this.#config.about}`);
    Logger.info(`${_cc.bcn}Link:${_cc.x}${_cc.gn} ${this.#config.urls.profile}`);
    Logger.info(`${_cc.bcn}Watch Time:${_cc.x}${_cc.gn} ${this.#getTimeWatchedStr()}`);
    Logger.info(
      `${_cc.bcn}Series Completed:${_cc.x}${_cc.gn} ${this.#config.stats.completedSeries}`
    );
  }

  async updateAnime(url: string, data: LibraryPatchData) {
    const resp = await HTTP.patch(
      new URL(url),
      JSON.stringify(data),
      this.#config.access_token
    );
    if (resp instanceof Error) {
      Logger.error(resp.message);
      process.exit(1);
    }
    const resolvedData = await resp.json();
    if (resp.status > 200) {
      console.log('');
      Logger.error(`${_cc.rd}Kitsu API Error`);
      Logger.error(resolvedData['errors'][0]['detail']);
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

  findAnime(name: string) {
    const anime = this.#animeCache.filter((anime) =>
      anime[1].toLowerCase().includes(name.toLowerCase())
    );
    return anime;
  }

  async reloadAnimeCache() {
    if (!this.#config.access_token) {
      Logger.error('KitsuAPI not initialized');
      process.exit(1);
    }
    const cachedAnime = await this.#populateCurrentAnimeCache();
    this.#animeCache = cachedAnime;
    Logger.info(`Cache Reloaded: ${_cc.bgn}${cachedAnime.length}`);
  }

  async #tryLoadAnimeCache() {
    if (!existsSync(pathJoin(_workingDir, '.aniwatch.cache'))) {
      const animeCache = await this.#populateCurrentAnimeCache();
      Logger.info(`Cached Anime: ${_cc.bgn}${animeCache.length}`);
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
    const url = new URL(this.#config.urls.library);
    url.searchParams.append('filter[status]', 'current');
    url.searchParams.append('page[limit]', '200');
    url.searchParams.append('include', 'anime');
    const resp = await HTTP.get(url, this.#config.access_token);
    if (resp instanceof Error) {
      Logger.error(resp.message);
      process.exit(1);
    }
    const zodResp = LibraryInfo.safeParse(await resp.json());
    if (zodResp.success) {
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
    } else {
      displayZodErrors(zodResp.error, 'Library Parse Failed');
      process.exit(1);
    }
  }

  async #getUser(name: string) {
    const url = new URL('https://kitsu.io/api/edge/users');
    url.searchParams.append('filter[name]', name);
    url.searchParams.append('include', 'stats');
    const resp = await HTTP.get(url);
    if (resp instanceof Error) {
      Logger.error(resp.message);
      process.exit(1);
    }
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
    this.#saveConfig(this.#config, 'Saved');
    Logger.info(`Refreshed Access Token: ${data.access_token}`);
  }

  async #tryGetDataFromResp<T = unknown>(resp: Error | Response) {
    if (resp instanceof Error) {
      Logger.error(resp.message);
      process.exit(1);
    }
    const data = await resp.json();
    if (resp.status > 200) {
      console.log('');
      Logger.error(`${data['error']}`);
      if (data['error'] == 'invalid_grant') {
        Logger.error(`${_cc.byw}Make sure you entered the correct password`);
      }
      Logger.error(`${data['error_description']}`);
      process.exit(1);
    }
    return data as T;
  }

  async #tryLoadConfig() {
    const configRes = await tryCatchAsync(
      readFile(pathJoin(_workingDir, 'aniwatch.json'))
    );
    if (configRes instanceof Error) {
      if (configRes.message.includes('ENOENT')) {
        Logger.info(`Missing Config -- ${_cc.ma}Setup Activated${_cc.x}`);
        return await this.#trySetupConfig();
      }
      Logger.error(configRes.message);
      process.exit(1);
    }
    const config = validateConfig(JSON.parse(configRes.toString('utf-8')));
    return config;
  }

  async #trySetupConfig() {
    const user = await this.#promptUser();
    const password = await this.#promptPassword();
    const tokens = await this.#getAuthTokens(user.attributes.name, password);
    if (!user.stats.time || !user.stats.completed) {
      Logger.error('Stats Undefined');
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
      password,
      ...tokens,
    };
    console.log('');
    this.#saveConfig(configFile, 'Created');
    return configFile;
  }

  async #promptUser(): Promise<UserData> {
    console.log('');
    const username = await CLI.prompt(
      Logger.printRaw('ma', 'prompt', `${_cc.bwt}Enter Kitsu username:${_cc.x} `)
    );
    const user = await this.#getUser(username);
    console.log('');
    Logger.info(`${_cc.bcn}Name: ${_cc.gn}${user.attributes.name}`);
    Logger.info(
      `${_cc.bcn}Profile: ${_cc.gn}https://kitsu.io/users/${user.attributes.name}`
    );
    Logger.info(`${_cc.bcn}About: ${_cc.x}${user.attributes.about}`);
    console.log('');
    const isVerifiedUser =
      (await CLI.prompt(
        Logger.printRaw('ma', 'prompt', `${_cc.yw}Is this you? ${_cc.bwt}(y/n) `)
      )) == 'y';
    if (!isVerifiedUser) {
      return await this.#promptUser();
    }
    return user;
  }

  async #promptPassword() {
    console.log('');
    return await CLI.prompt(
      Logger.printRaw('ma', 'prompt', `${_cc.bwt}Enter password: ${_cc.byw}`)
    );
  }

  #saveConfig(config: ConfigFile, msg: string) {
    writeFileSync(
      pathJoin(_workingDir, 'aniwatch.json'),
      JSON.stringify(config, null, 2)
    );
    Logger.info(`Config File: ${_cc.bgn}${msg}`);
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

function validateConfig(configObj: object) {
  const zodRes = ConfigFile.safeParse(configObj);
  if (!zodRes.success) {
    displayZodErrors(zodRes.error, 'Config Files Errors');
    process.exit(1);
  }
  return zodRes.data;
}

function displayZodErrors(zodError: ZodError, msg: string) {
  console.log('');
  Logger.error(`${_cc.rd}${msg}`);
  zodError.issues.forEach((issue) => {
    Logger.error(`${_cc.yw}${issue.path}${_cc.x}: ${issue.message}`);
  });
}
