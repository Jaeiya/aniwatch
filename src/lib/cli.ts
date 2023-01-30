import { Logger } from './logger.js';
import help from './help.js';

type RegisteredFlag = [
  short: string,
  long: string,
  func: () => void | Promise<void>,
  type: 'multiArg' | 'simple'
];

const _registeredFlags: RegisteredFlag[] = [];

const _cc = Logger.consoleColors;
const rawArgs = process.argv;
const execPath = process.argv[0];
const sourcePath = process.argv[1];
const workingDir = process.cwd();
const userArgs = process.argv.slice(2);
const flagArgs = userArgs.filter((arg: string) => arg.indexOf('-') == 0 && arg[2] != '-');
const nonFlagArgs = userArgs.filter((arg) => !flagArgs.includes(arg));
const cleanFlagArgs = flagArgs.map(removeLeadingDash);

export default {
  execPath,
  sourcePath,
  workingDir,
  rawArgs,
  userArgs,
  flagArgs,
  nonFlagArgs,
  registerFlag,
  tryExecFlags,
};

async function tryExecFlags() {
  const regFlag = _registeredFlags.find((rf) => rf.includes(cleanFlagArgs[0]));
  if (!regFlag && cleanFlagArgs[0]) {
    Logger.chainError([
      '',
      `${_cc.rd}Flag Error`,
      `${_cc.bcn}Unknown Flag: ${_cc.byw}${flagArgs[0]}`,
    ]);
    process.exit(1);
  }
  if (!regFlag) return false;
  const [, , func, type] = regFlag;

  type == 'simple'
    ? isValidSingleFlag(0)
    : isValidSingleFlag(Infinity, help.getFindAnimeHelp());

  func instanceof Promise ? await func() : func();
  return true;
}

function registerFlag(
  shortFlag: string,
  longFlag: string,
  func: () => void | Promise<void>,
  type: 'multiArg' | 'simple'
) {
  _registeredFlags.push([shortFlag, longFlag, func, type]);
}

/**
 * Tests for a valid flag that can only be used by itself
 * with the specified number of arguments.
 */
function isValidSingleFlag(numOfArgs: number, helpArray?: string[]) {
  if (nonFlagArgs.length > numOfArgs || flagArgs.length > 1) {
    Logger.error(`${_cc.rd}Invalid Flag Syntax`);
    Logger.error('Read the help below to learn the correct syntax');
    if (helpArray) {
      Logger.chainInfo(['', ...helpArray]);
    } else {
      help.displaySimpleFlagHelp();
    }
    process.exit(1);
  }
  return true;
}

function removeLeadingDash(str: string): string {
  if (str[0] == '-') {
    return removeLeadingDash(str.substring(1));
  }
  return str;
}
