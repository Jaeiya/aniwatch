import { writeFileSync } from 'fs';
import { KitsuData, zodKitsuConfigData } from './kitsu/kitsu-schemas.js';
import { parseWithZod, pathJoin, tryCatchAsync } from './utils.js';
import * as z from 'zod';
import { readFile } from 'fs/promises';
import { Kitsu } from './kitsu/kitsu.js';

let _config: ConfigFile = {} as any;
const _configFileName = 'wakitsu.json';

export type ConfigFile = z.infer<typeof ConfigSchema>;
const ConfigSchema = z.object({
    kitsu: z.object(zodKitsuConfigData),
});

export class Config {
    static get<K extends keyof ConfigFile>(key: K) {
        if (!_config) throw Error('config not initialized');
        return _config[key];
    }

    static getKitsuProp<K extends keyof KitsuData>(key: K) {
        if (!_config) throw Error('config not initialized');
        return _config.kitsu[key];
    }

    static setKitsuProp<K extends keyof KitsuData, T extends KitsuData[K]>(key: K, val: T) {
        if (!_config) throw Error('config not initialized');
        _config.kitsu[key] = val;
    }

    static setKitsuData(data: KitsuData) {
        if (!_config) throw Error('config not initialized');
        _config.kitsu = data;
    }

    static async init() {
        const asyncRes = await tryCatchAsync(
            readFile(pathJoin(process.cwd(), _configFileName))
        );
        if (!asyncRes.success) {
            if (asyncRes.error.message.includes('ENOENT')) {
                await Kitsu.init();
                Config.save();
                return;
            }
            _con.error(asyncRes.error.message);
            process.exit(1);
        }
        const respDataObj = JSON.parse(asyncRes.data.toString('utf-8'));
        const [error, data] = parseWithZod(ConfigSchema, respDataObj, 'ConfigFile');
        if (error) {
            return;
        }
        _config = data;
    }

    static save() {
        writeFileSync(
            pathJoin(process.cwd(), _configFileName),
            JSON.stringify(_config, null, 2)
        );
        _con.info(';bc;Config File: ;g;Saved');
    }
}
