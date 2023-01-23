import { resolve, join } from 'path';
import { ZodError } from 'zod';
import { Logger } from './logger.js';

const _cc = Logger.consoleColors;

export function isDev() {
  return process.env.NODE_ENV == 'development';
}

export function toEpisodeNum(epNum: number) {
  if (epNum < 10) {
    return `0${epNum}`;
  }
  return `${epNum}`;
}

export function fitString(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return `${str.substring(0, maxLength)}...`;
  }
  return str;
}

export function displayZodErrors(zodError: ZodError, msg: string) {
  console.log('');
  Logger.error(`${_cc.rd}${msg}`);
  zodError.issues.forEach((issue) => {
    Logger.error(`${_cc.yw}${issue.path}${_cc.x}: ${issue.message}`);
  });
}

export async function tryCatchAsync<T>(p: Promise<T>): Promise<T | Error> {
  try {
    const data = await p;
    return data;
  } catch (e) {
    return Error((e as Error).message);
  }
}

export function truncateStr(str: string, length: number) {
  const substr = str.substring(0, length);
  return substr.length < str.length ? `${substr}...` : str;
}

export function titleFromAnimeFileName(name: string, ep: string) {
  return name.replace(`[subsplease]`, '').split(`- ${ep}`)[0].trim();
}

export const pathResolve = resolve;
export const pathJoin = join;
