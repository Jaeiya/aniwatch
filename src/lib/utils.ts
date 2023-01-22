import { resolve, join } from 'path';

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

export const pathResolve = resolve;
export const pathJoin = join;
