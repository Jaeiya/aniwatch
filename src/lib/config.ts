import { writeFileSync } from 'fs';
import { KitsuData, zodKitsuConfigData } from './kitsu/kitsu-schemas.js';
import { parseWithZod, pathJoin, tryCatchAsync } from './utils.js';
import * as z from 'zod';
import { readFile } from 'fs/promises';
import { DeepPartial } from '../types/globals.js';
import { Printer } from './printer/printer.js';

export type ConfigFile = z.infer<typeof ConfigSchema>;
type PartialConfigFile = DeepPartial<ConfigFile>;
type SetDefaultPropsFn = (config: PartialConfigFile) => PartialConfigFile;

type ConfigInitOptions = {
    setupNewConfig: () => Promise<void>;
    setDefaultProps: SetDefaultPropsFn;
};

let _config: ConfigFile = {} as any;
const _configFileName = 'wakitsu.json';

const ConfigSchema = z.object({
    useColor: z.boolean(),
    kitsu: z.object(zodKitsuConfigData),
});

export class Config {
    static get<K extends keyof ConfigFile>(key: K) {
        if (!_config) throw Error('config not initialized');
        return _config[key];
    }

    static set<K extends keyof ConfigFile, T extends ConfigFile[K]>(key: K, val: T) {
        _config[key] = val;
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

    static async init(options: ConfigInitOptions) {
        const asyncRes = await tryCatchAsync(
            readFile(pathJoin(process.cwd(), _configFileName))
        );
        if (!asyncRes.success) {
            if (asyncRes.error.message.includes('ENOENT')) {
                await options.setupNewConfig();
                return Config.save();
            }
            _con.error(asyncRes.error.message);
            process.exit(1);
        }
        const respDataObj: PartialConfigFile = JSON.parse(asyncRes.data.toString('utf-8'));
        const [error, data] = parseWithZod(ConfigSchema, respDataObj, 'ConfigFile');
        if (error) {
            tryUpdateConfig(respDataObj, options.setDefaultProps);
            return;
        }
        _config = data;
    }

    static save() {
        writeFileSync(
            pathJoin(process.cwd(), _configFileName),
            JSON.stringify(_config, null, 2)
        );
    }
}

async function tryUpdateConfig(
    partialConfig: PartialConfigFile,
    setDefaultProps: SetDefaultPropsFn
) {
    const config = setDefaultProps({ ...partialConfig });
    const [error, data] = parseWithZod(ConfigSchema, config, 'ConfigFile');
    if (error) {
        _con.chainError(error);
        process.exit(1);
    }
    _config = data;
    Printer.printWarning(
        'An older version of the Config file has been discovered and updated ' +
            'to reflect latest Wakitsu changes.',
        'Config Updated'
    );
    Config.save();
}
