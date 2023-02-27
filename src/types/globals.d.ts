import { ConsoleLogger } from '../lib/logger.ts';

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
