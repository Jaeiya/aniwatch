import readline from 'readline';
import { Logger } from './logger.js';

type ValidShortFlags = typeof _validShortFlags[number];
type ValidLongFlags = typeof _validLongFlags[number];

const _validShortFlags = <const>['r', 'p', 'c', 'f'];
const _validLongFlags = <const>['reload-cache', 'profile', 'cache', 'find-anime'];

const _cc = Logger.consoleColors;

export class CLI {
  static args = process.argv;
  static execPath = process.argv[0];
  static sourcePath = process.argv[1];
  static workingDir = process.cwd();
  static allArgs = process.argv.slice(2);

  static get flagArgs() {
    const flags = [...this.getAllFlags()];
    return this.allArgs.filter((arg) => !flags.includes(arg));
  }

  static tryReloadFlag() {
    const isValidFlag = this.hasShortFlag('r') || this.hasLongFlag('reload-cache');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('r');
    return true;
  }

  static tryProfileFlag() {
    const isValidFlag = this.hasShortFlag('p') || this.hasLongFlag('profile');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('p');
    return true;
  }

  static tryCacheFlag() {
    const isValidFlag = this.hasShortFlag('c') || this.hasLongFlag('cache');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('c');
    return true;
  }

  static tryFlag(flag: ValidLongFlags) {
    switch (flag) {
      case 'cache':
        return this.tryCacheFlag();
      case 'reload-cache':
        return this.tryReloadFlag();
      case 'find-anime':
        return this.tryFindAnimeFlag();
      case 'profile':
        return this.tryProfileFlag();
    }
  }

  static tryFindAnimeFlag() {
    const isValidFlag = this.hasShortFlag('f') || this.hasLongFlag('find-anime');
    if (!isValidFlag) return false;
    this.validateNumberOfFlags(1, 'f');
    if (this.allArgs.length > 2) {
      this.displayInvalidFlagInfo(
        `Only ${_cc.byw}1${_cc.x} argument allowed for ${_cc.byw}-f`
      );
      process.exit(1);
    }
    if (this.allArgs.length == 1) {
      this.displayInvalidFlagInfo(
        `${_cc.byw}-f${_cc.x} requires ${_cc.byw}1${_cc.x} argument`
      );
      process.exit(1);
    }
    return true;
  }

  static getAllFlags = () => {
    const hasSingleOrDoubleDash = (arg: string) => arg.indexOf('-') == 0 && arg[2] != '-';
    return this.allArgs.filter(hasSingleOrDoubleDash);
  };

  static getShortFlags = () => {
    const hasSingleDash = (arg: string) => arg.indexOf('-') == 0 && arg[1] != '-';
    return this.allArgs.filter(hasSingleDash);
  };

  static getLongFlags = () => {
    const hasDoubleDash = (arg: string) => arg.indexOf('--') == 0 && arg[2] != '-';
    return this.allArgs.filter(hasDoubleDash);
  };

  static hasShortFlag(flag: ValidShortFlags) {
    return this.allArgs.includes(`-${flag}`);
  }

  static hasLongFlag(flag: ValidLongFlags) {
    return this.allArgs.includes(`--${flag}`);
  }

  static displayInvalidFlagInfo(msg: string) {
    Logger.error(`${_cc.rd}Invalid Flag Configuration`);
    Logger.error(msg);
  }

  static validateNumberOfFlags(num: number, flag: ValidShortFlags | ValidLongFlags) {
    if (this.getAllFlags().length > num) {
      this.displayInvalidFlagInfo(
        `${_cc.byw}-${flag}${_cc.x} can only be used with ${_cc.byw}${num - 1}${
          _cc.x
        } other flags`
      );
      process.exit(1);
    }
  }

  static testSingleFlagConfig(flag: ValidShortFlags | ValidLongFlags) {
    this.validateNumberOfFlags(1, flag);

    if (this.allArgs.length > 1) {
      this.displayInvalidFlagInfo(
        `${_cc.byw}-${flag}${_cc.x} does not require any arguments`
      );
      process.exit(1);
    }
  }

  static async prompt(query: string) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((rs) => {
      rl.question(query, rs);
    });
    rl.close();
    return answer;
  }
}
