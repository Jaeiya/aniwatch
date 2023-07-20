import { Log, Printer } from '../printer/printer.js';

export type CLIFlagType = 'multiArg' | 'simple';
export type CLIFlagName = [short: string, long: string];

const _flags: CLIFlag[] = [];

const rawArgs = process.argv;
const execPath = process.argv[0];
const sourcePath = process.argv[1];
const workingDir = process.cwd();
const userArgs = process.argv.slice(2);
const flagArgs = userArgs.filter((arg: string) => arg.indexOf('-') == 0 && arg[2] != '-');
const nonFlagArgs = userArgs.filter((arg) => !flagArgs.includes(arg)).map((arg) => arg.trim());
const cleanFlagArgs = flagArgs.map(removeLeadingDashes);

export class CLI {
    static execPath = execPath;
    static sourcePath = sourcePath;
    static workingDir = workingDir;
    /** All arguments passed, including nodejs default args */
    static rawArgs = rawArgs;
    /** Only the arguments input at the command line */
    static userArgs = userArgs;
    /** Arguments that are flags (ex: `-f hello there => ['-f']`) */
    static flagArgs = flagArgs;
    /** Arguments that are not flags (ex: `-f some args => ['some', 'args']`) */
    static nonFlagArgs = nonFlagArgs;

    static get flags() {
        return _flags.slice(0);
    }

    static addFlag(flag: CLIFlag) {
        if (flag.type == 'simple' && flag.shortHelpDisplay == undefined) {
            throw Error(`"--${flag.name[1]}" flag must have a "shortHelpDisplay"`);
        }

        const existingFlag = _flags.find((f) => {
            for (const name of f.name) {
                if (flag.name.includes(name)) {
                    return true;
                }
            }
            return false;
        });

        if (existingFlag) {
            throw Error(
                `One or more of these flag names already exists: ${flag.name
                    .map((f) => `"${f}"`)
                    .join(', ')}`
            );
        }

        _flags.push(flag);
    }

    static async tryExecFlags() {
        if (!cleanFlagArgs[0]) {
            const defaultFlag = _flags.find((f) => f.isDefault);
            if (!defaultFlag) throw Error('missing default flag');
            defaultFlag.exec(CLI);
            return true;
        }
        const flag = _flags.find((f) => f.name.includes(cleanFlagArgs[0]));

        if (!validateFlag(flag)) {
            process.exit(1);
        }

        flag.exec instanceof Promise ? await flag.exec(CLI) : flag.exec(CLI);
        return true;
    }
}

function validateFlag(flag?: CLIFlag): flag is CLIFlag {
    if (!flag) {
        Printer.printError(`;bc;Unknown Flag: ;by;${flagArgs[0]}`, 'Unknown Flag');
        return false;
    }

    const { type } = flag;
    return type == 'simple'
        ? isValidSingleFlag(0, flag)
        : isValidSingleFlag(Infinity, flag) && isMultiArg(flag);
}

function isValidSingleFlag(numOfArgs: number, flag: CLIFlag) {
    if (nonFlagArgs.length > numOfArgs || flagArgs.length > 1) {
        Printer.printError(
            'Read the help below to learn the correct syntax',
            'Invalid Flag Syntax'
        );
        flag.printHelp();
        return false;
    }
    return true;
}

function isMultiArg(flag: CLIFlag) {
    if (!nonFlagArgs.length) {
        Printer.printError(
            'Read the help below to learn the correct syntax:',
            'Missing Argument'
        );
        flag.printSyntax();
        return false;
    }
    return true;
}

function removeLeadingDashes(str: string): string {
    if (str[0] == '-') {
        return removeLeadingDashes(str.substring(1));
    }
    return str;
}

export abstract class CLIFlag {
    isDefault = false;
    shortHelpDisplay = '';

    /**
     * Print syntax by itself if it exists, otherwise print default
     * help.
     */
    printSyntax() {
        Printer.print(this.getSyntaxHelpLogs() || this.getHelpLogs());
    }

    printHelp() {
        const syntaxLogs = this.getSyntaxHelpLogs();
        if (syntaxLogs) {
            Printer.print([...this.getHelpLogs(), ...syntaxLogs]);
        } else {
            Printer.print(this.getHelpLogs());
        }
    }

    getSyntaxHelpLogs(): Log[] | null {
        return null;
    }

    /** Short and Long flag name */
    abstract readonly name: CLIFlagName;
    abstract readonly type: CLIFlagType;
    abstract readonly helpAliases: string[];
    abstract getHelpLogs(): Log[];
    abstract exec(cli: typeof CLI): void | Promise<void>;
}
