import { resolve, join, basename } from 'path';
import { z, ZodSchema } from 'zod';

export type FansubFilenameData = {
    fansub: string;
    title: string;
    epNum: number;
    paddedEpNum: string;
    season: string;
    bitrate: string;
};

export function isDev() {
    return process.env.NODE_ENV == 'development';
}

export function parseWithZod<T extends ZodSchema>(
    schema: T,
    data: unknown,
    failedSchemaName: string
) {
    const zodResp = schema.safeParse(data);
    if (!zodResp.success) {
        const errorMsgArray = [
            `;r;Failed To Parse ;by;${failedSchemaName} ;r;Schema`,
            ...zodResp.error.issues.map((issue) => {
                return `;y;${issue.path};x;: ${
                    issue.message == 'Required' ? 'Missing or Undefined' : issue.message
                }`;
            }),
        ];
        return [errorMsgArray, null] as const;
        // process.exit(1);
    }
    return [null, zodResp.data as z.infer<T>] as const;
}

type AsyncError = {
    success: false;
    error: Error;
};
type AsyncSuccess<T> = {
    success: true;
    data: T;
};

type AsyncResponse<T> = Promise<AsyncError | AsyncSuccess<T>>;

export async function tryCatchAsync<T>(p: Promise<T>): AsyncResponse<T> {
    try {
        const data = await p;
        return {
            success: true,
            data,
        };
    } catch (e) {
        if (e instanceof Error) {
            return {
                success: false,
                error: e,
            };
        }
        return {
            success: false,
            error: Error('unknown error', { cause: e }),
        };
    }
}

export function fitStringEnd(str: string, maxLength: number) {
    if (str.length > maxLength) {
        throw Error(`cannot fit "${str}" inside a length of ${maxLength}`);
    }
    return `${str}${' '.repeat(maxLength - str.length)}`;
}

export function truncateStr(str: string, length: number) {
    const substr = str.substring(0, length);
    return substr.length < str.length ? `${substr}...` : str;
}

export function getColoredTimeWatchedStr(seconds: number) {
    const { hours, days, months } = getTimeUnits(seconds);
    const leftOverMinutes = (hours % 1) * 60;
    const coloredMinutesLeft = `;by;${leftOverMinutes.toFixed(0)} ;g;Minutes`;
    const coloredHours = `;by;${Math.floor(hours)} ;g;Hours`;
    const coloredDays = `;by;${hours.toFixed(1)} ;g;Days`;
    const coloredMonths = `;by;${months.toFixed(1)} ;g;Months`;

    const allTimeStr = months >= 1 ? coloredMonths : days >= 1 ? coloredDays : coloredHours;

    return {
        allTimeStr,
        hoursAndMinutesLeft: `${coloredHours};g;, ${coloredMinutesLeft}`,
    };
}

export function getTimeUnits(seconds: number) {
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const months = days / 30;
    return {
        minutes,
        hours,
        days,
        months,
    };
}

export function createReadableBytesFunc() {
    const m = new Map();
    m.set('TB', 1_099_511_627_776);
    m.set('GB', 1_073_741_824);
    m.set('MB', 1_048_576);
    m.set('KB', 1_024);

    return function toMaxReadableBytes(bytes: number) {
        for (const [strSize, byteSize] of m) {
            if (bytes >= byteSize) {
                return `${(bytes / byteSize).toFixed(2)} ${strSize}`;
            }
        }
        throw Error(`cannot determine size of "${bytes}" bytes`);
    };
}

export function parseFansubFilename(name: string) {
    const fansubRegEx =
        /^\[([\w|\d|\s]+)\]\s(.+)(\sS[0-9]{1,2})?\s-\s([0-9]{2,4}|S([0-9]{2})E([0-9]{2,4}))\s[[(]([0-9]{3,4}p)?/gi;
    const parts = fansubRegEx.exec(name);
    if (!parts) {
        _con.chainError([
            '',
            ';r;Unsupported File Name',
            `;by;Failed to parse file name: "${name}"`,
            ';bc;Try to find another fansub group.',
        ]);
        process.exit(1);
    }
    const [, fansub, title, season, epNum, seasonAlt, epNumAlt, bitrate] = parts;
    const realEpNum = epNumAlt ?? epNum;
    const animeData: FansubFilenameData = {
        fansub,
        title,
        epNum: realEpNum[0] == '0' ? Number(realEpNum[1]) : Number(realEpNum),
        paddedEpNum: realEpNum,
        season: seasonAlt ?? season ?? ';m;unspecified',
        bitrate: bitrate ?? ';m;unknown',
    };
    return animeData;
}

export const pathResolve = resolve;
export const pathJoin = join;
export const pathBasename = basename;
