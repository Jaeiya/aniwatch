import readline from 'readline';
import { Logger } from './logger.js';

type ValidShortFlags = typeof _validShortFlags[number];
type ValidLongFlags = typeof _validLongFlags[number];

const _validShortFlags = <const>['r', 'p', 'c'];
const _validLongFlags = <const>['reload-cache', 'profile', 'cache'];

const _cc = Logger.consoleColors;

export class CLI {
  static args = process.argv;
  static execPath = process.argv[0];
  static sourcePath = process.argv[1];
  static workingDir = process.cwd();
  static userArgs = process.argv.slice(2);

  static get hasReloadFlag() {
    const isValidFlag = this.hasShortFlag('r') || this.hasLongFlag('reload-cache');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('r');
    return true;
  }

  static get hasProfileFlag() {
    const isValidFlag = this.hasShortFlag('p') || this.hasLongFlag('profile');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('p');
    return true;
  }

  static get hasCacheFlag() {
    const isValidFlag = this.hasShortFlag('c') || this.hasLongFlag('cache');
    if (!isValidFlag) return false;
    this.testSingleFlagConfig('c');
    return true;
  }

  static getAllFlags = () => {
    const hasSingleOrDoubleDash = (arg: string) => arg.indexOf('-') == 0 && arg[2] != '-';
    return this.userArgs.filter(hasSingleOrDoubleDash);
  };

  static getShortFlags = () => {
    const hasSingleDash = (arg: string) => arg.indexOf('-') == 0 && arg[1] != '-';
    return this.userArgs.filter(hasSingleDash);
  };

  static getLongFlags = () => {
    const hasDoubleDash = (arg: string) => arg.indexOf('--') == 0 && arg[2] != '-';
    return this.userArgs.filter(hasDoubleDash);
  };

  static hasShortFlag(flag: ValidShortFlags) {
    return this.userArgs.includes(`-${flag}`);
  }

  static hasLongFlag(flag: ValidLongFlags) {
    return this.userArgs.includes(`--${flag}`);
  }

  static displayInvalidFlagInfo(msg: string) {
    Logger.error(`${_cc.rd}Invalid Flag Configuration`);
    Logger.error(msg);
  }

  static testSingleFlagConfig(flag: ValidShortFlags | ValidLongFlags) {
    if (this.getAllFlags().length > 1) {
      this.displayInvalidFlagInfo(
        `${_cc.byw}-${flag}${_cc.x} can only be used by itself`
      );
      process.exit(1);
    }

    if (this.userArgs.length > 1) {
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
