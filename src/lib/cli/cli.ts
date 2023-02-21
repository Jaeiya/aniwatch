import { Logger } from '../logger.js';
import { Help } from '../help.js';

export type CLIFlagType = 'multiArg' | 'simple';
export type CLIFlagName = [short: string, long: string];

export interface CLIFlag {
    /** Short and Long Flag Names */
    name: CLIFlagName;
    type: CLIFlagType;
    isDefault?: boolean;
    helpAliases: string[];
    shortHelpDisplay?: string;
    helpDisplay: string[];
    helpSyntax?: string[];
    /** Execute flag function */
    exec: (cli: typeof CLI) => void | Promise<void>;
}

const _flags: CLIFlag[] = [];

const _cc = Logger.consoleColors;
const rawArgs = process.argv;
const execPath = process.argv[0];
const sourcePath = process.argv[1];
const workingDir = process.cwd();
const userArgs = process.argv.slice(2);
const flagArgs = userArgs.filter((arg: string) => arg.indexOf('-') == 0 && arg[2] != '-');
const nonFlagArgs = userArgs.filter((arg) => !flagArgs.includes(arg)).map((arg) => arg.trim());
const cleanFlagArgs = flagArgs.map(removeLeadingDash);

export class CLI {
    static execPath = execPath;
    static sourcePath = sourcePath;
    static workingDir = workingDir;
    static rawArgs = rawArgs;
    static userArgs = userArgs;
    static flagArgs = flagArgs;
    static nonFlagArgs = nonFlagArgs;

    static addFlag(flag: CLIFlag) {
        if (flag.type == 'simple' && flag.shortHelpDisplay == undefined) {
            throw Error(`"--${flag.name[1]}" flag must have a "shortHelpDisplay"`);
        }

        flag.type == 'simple'
            ? Help.addSimpleHelp(flag.helpAliases, flag.name, [
                  flag.shortHelpDisplay ?? '',
                  flag.helpDisplay,
              ])
            : Help.addAdvancedFlagHelp(flag.helpAliases, flag.helpDisplay);

        _flags.push(flag);
    }

    static async tryExecFlags() {
        if (!cleanFlagArgs[0]) {
            const defaultFlag = _flags.find((rf) => rf.isDefault);
            if (!defaultFlag) throw Error('missing default flag');
            defaultFlag.exec(CLI);
            return true;
        }
        const flag = _flags.find((rf) => rf.name.includes(cleanFlagArgs[0]));

        if (!validateFlag(flag)) {
            process.exit(1);
        }

        flag.exec instanceof Promise ? await flag.exec(CLI) : flag.exec(CLI);
        return true;
    }
}

function validateFlag(flag?: CLIFlag): flag is CLIFlag {
    if (!flag) {
        Logger.chainError([
            '',
            `${_cc.rd}Flag Error`,
            `${_cc.bcn}Unknown Flag: ${_cc.byw}${flagArgs[0]}`,
        ]);
        return false;
    }

    const { type } = flag;
    return type == 'simple'
        ? isValidSingleFlag(0, flag)
        : isValidSingleFlag(Infinity, flag) && isMultiArg(flag);
}

/**
 * Tests for a valid flag that can only be used by itself
 * with the specified number of arguments.
 */
function isValidSingleFlag(numOfArgs: number, flag: CLIFlag) {
    if (nonFlagArgs.length > numOfArgs || flagArgs.length > 1) {
        Logger.chainError([
            `${_cc.rd}Invalid Flag Syntax`,
            'Read the help below to learn the correct syntax',
            '',
        ]);
        displayFlagHelp(flag);
        return false;
    }
    return true;
}

function isMultiArg(flag: CLIFlag) {
    if (!nonFlagArgs.length) {
        Logger.chainError([
            `${_cc.rd}Missing Argument`,
            'Read the help below to learn the correct syntax:',
            '',
        ]);
        displayFlagHelp(flag);
        return false;
    }
    return true;
}

function displayFlagHelp(flag: CLIFlag) {
    if (flag.type == 'multiArg' && flag.helpSyntax) {
        Help.displayHelp(flag.helpSyntax);
        return;
    }
    const flagHelp = Help.findHelp(flag.helpAliases[0]);
    if (!flagHelp) throw Error(`missing "${flag.name[1]}" flag help`);
    Help.displayHelp(flagHelp);
}

function removeLeadingDash(str: string): string {
    if (str[0] == '-') {
        return removeLeadingDash(str.substring(1));
    }
    return str;
}
