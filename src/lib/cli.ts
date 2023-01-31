import { Logger } from './logger.js';
import help from './help.js';

type RegisteredFlag = [
  short: string,
  long: string,
  func: () => void | Promise<void>,
  type: 'multiArg' | 'simple',
  helpFunc?: () => void
];

const _registeredFlags: RegisteredFlag[] = [];

const _cc = Logger.consoleColors;
const rawArgs = process.argv;
const execPath = process.argv[0];
const sourcePath = process.argv[1];
const workingDir = process.cwd();
const userArgs = process.argv.slice(2);
const flagArgs = userArgs.filter((arg: string) => arg.indexOf('-') == 0 && arg[2] != '-');
const nonFlagArgs = userArgs
  .filter((arg) => !flagArgs.includes(arg))
  .map((arg) => arg.trim());
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
  if (!cleanFlagArgs[0]) return false;
  const regFlag = _registeredFlags.find((rf) => rf.includes(cleanFlagArgs[0]));

  if (!regFlag) {
    Logger.chainError([
      '',
      `${_cc.rd}Flag Error`,
      `${_cc.bcn}Unknown Flag: ${_cc.byw}${flagArgs[0]}`,
    ]);
    process.exit(1);
  }

  const [, , func, type, helpFunc] = regFlag;
  type == 'simple'
    ? isValidSingleFlag(0, helpFunc)
    : isValidSingleFlag(Infinity, helpFunc) && isMultiArg(helpFunc);

  func instanceof Promise ? await func() : func();
  return true;
}

function registerFlag(
  shortFlag: string,
  longFlag: string,
  func: () => void | Promise<void>,
  type: 'multiArg' | 'simple',
  helpFunc?: () => void
) {
  _registeredFlags.push([shortFlag, longFlag, func, type, helpFunc]);
}

/**
 * Tests for a valid flag that can only be used by itself
 * with the specified number of arguments.
 */
function isValidSingleFlag(numOfArgs: number, helpFunc?: () => void) {
  if (nonFlagArgs.length > numOfArgs || flagArgs.length > 1) {
    Logger.chainError([
      `${_cc.rd}Invalid Flag Syntax`,
      'Read the help below to learn the correct syntax',
    ]);
    helpFunc ? helpFunc() : help.displaySimpleFlagHelp();
    process.exit(1);
  }
  return true;
}

function isMultiArg(helpFunc?: () => void) {
  if (!nonFlagArgs.length) {
    Logger.chainError([
      `${_cc.rd}Missing Argument`,
      'Read the help below to learn the correct syntax:',
    ]);
    helpFunc
      ? helpFunc()
      : Logger.error(`${_cc.bcn}Missing Syntax Help for ${_cc.byw}${flagArgs[0]}`);

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
