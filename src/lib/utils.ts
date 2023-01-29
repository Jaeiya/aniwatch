import { resolve, join } from 'path';
import { z, ZodSchema } from 'zod';
import { Logger } from './logger.js';

const _cc = Logger.consoleColors;

export function isDev() {
  return process.env.NODE_ENV == 'development';
}

export function toEpisodeNumberStr(epNum: number) {
  if (epNum < 10) {
    return `0${epNum}`;
  }
  return `${epNum}`;
}

export function parseWithZod<T extends ZodSchema>(
  schema: T,
  data: unknown,
  failedSchema: string
) {
  const zodResp = schema.safeParse(data);
  if (!zodResp.success) {
    Logger.chainError([
      `${_cc.rd}Failed To Parse ${_cc.byw}${failedSchema} ${_cc.rd}Schema`,
      ...zodResp.error.issues.map((issue) => {
        return `${_cc.yw}${issue.path}${_cc.x}: ${
          issue.message == 'Required' ? 'Missing or Undefined' : issue.message
        }`;
      }),
    ]);
    process.exit(1);
  }
  return zodResp.data as z.infer<T>;
}

export async function tryCatchAsync<T>(p: Promise<T>): Promise<T | Error> {
  try {
    const data = await p;
    return data;
  } catch (e) {
    return Error((e as Error).message);
  }
}

export function fitString(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return `${str.substring(0, maxLength)}...`;
  }
  return str;
}

export function truncateStr(str: string, length: number) {
  const substr = str.substring(0, length);
  return substr.length < str.length ? `${substr}...` : str;
}

export function titleFromAnimeFileName(name: string, ep: string) {
  return name.replace(`[subsplease]`, '').split(`- ${ep}`)[0].trim();
}

export function getColoredTimeWatchedStr(seconds: number) {
  const hoursWatchingAnime = seconds / 60 / 60;
  const leftOverMinutes = (hoursWatchingAnime % 1) * 60;
  const daysWatchingAnime = hoursWatchingAnime / 24;
  const monthsWatchingAnime = daysWatchingAnime / 30;

  const coloredMinutesLeft = `${_cc.byw}${leftOverMinutes.toFixed(0)}${_cc.gn} Minutes`;
  const coloredHours = `${_cc.byw}${Math.floor(hoursWatchingAnime)}${_cc.gn} Hours`;
  const coloredDays = `${_cc.byw}${daysWatchingAnime.toFixed(1)}${_cc.gn} Days`;
  const coloredMonths = `${_cc.byw}${monthsWatchingAnime.toFixed(1)}${_cc.gn} Months`;

  const allTimeStr =
    monthsWatchingAnime >= 1
      ? coloredMonths
      : daysWatchingAnime >= 1
      ? coloredDays
      : coloredHours;

  return {
    allTimeStr,
    hoursAndMinutesLeft: `${coloredHours}${_cc.gn}, ${coloredMinutesLeft}`,
  };
}

export const pathResolve = resolve;
export const pathJoin = join;
