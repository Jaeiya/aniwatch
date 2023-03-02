import { ConsoleLogger } from '../lib/logger.ts';

export type DeepPartial<K> = {
    [attr in keyof K]?: K[attr] extends object
        ? DeepPartial<K[attr]>
        : K[attr] extends object | null
        ? DeepPartial<K[attr]> | null
        : K[attr] extends object | null | undefined
        ? DeepPartial<K[attr]> | null | undefined
        : K[attr];
};

declare global {
    // eslint-disable-next-line no-var
    var _con: typeof ConsoleLogger;
}

declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV: 'production' | 'development';
    }
}

export {};
