import { Logger } from './logger.js';
import help from './help.js';

type ValidShortFlags = typeof _validShortFlags[number];
type ValidLongFlags = typeof _validLongFlags[number];

const _validShortFlags = <const>['rc', 'p', 'c', 'f', 'rss', 'h'];
const _validLongFlags = <const>[
  'rebuild-cache',
  'profile',
  'cache',
  'find-anime',
  'rss-feed',
  'help',
];

const _cc = Logger.consoleColors;

export class CLI {
  static args = process.argv;
  static execPath = process.argv[0];
  static sourcePath = process.argv[1];
  static workingDir = process.cwd();
  static allArgs = process.argv.slice(2);

  static get flagArgs() {
    const flags = [...CLI.getAllFlags()];
    return CLI.allArgs.filter((arg) => !flags.includes(arg));
  }

  static tryRebuildCacheFlag() {
    const isValidFlag = CLI.hasShortFlag('rc') || CLI.hasLongFlag('rebuild-cache');
    if (!isValidFlag) return false;
    if (!CLI.hasArgs()) {
      Logger.error('Invalid Flag Syntax');
      Logger.chainInfo(['', ...help.getSimpleFlagHelp()]);
      process.exit(1);
    }
    return true;
  }

  static tryProfileFlag() {
    const isValidFlag = CLI.hasShortFlag('p') || CLI.hasLongFlag('profile');
    if (!isValidFlag) return false;
    if (CLI.hasArgs() || this.hasInvalidFlags(1)) {
      Logger.error('Invalid Flag Syntax');
      Logger.chainInfo(['', ...help.getSimpleFlagHelp()]);
      process.exit(1);
    }
    CLI.hasArgs();
    return true;
  }

  static tryCacheFlag() {
    const isValidFlag = CLI.hasShortFlag('c') || CLI.hasLongFlag('cache');
    if (!isValidFlag) return false;
    if (CLI.hasArgs() || this.hasInvalidFlags(1)) {
      Logger.error('Invalid Syntax');
      Logger.chainInfo(['', ...help.getSimpleFlagHelp()]);
      process.exit(1);
    }
    return true;
  }

  static tryHelpFlag() {
    const isValidFlag = CLI.hasShortFlag('h') || CLI.hasLongFlag('help');
    if (!isValidFlag) return false;
    if (CLI.hasArgs() || this.hasInvalidFlags(1)) {
      Logger.error('Invalid Syntax');
      Logger.chainInfo(['', ...help.getSimpleFlagHelp()]);
      process.exit(1);
    }
    return true;
  }

  static tryFindAnimeFlag() {
    const isValidFlag = CLI.hasShortFlag('f') || CLI.hasLongFlag('find-anime');
    if (!isValidFlag) return false;
    const hasInvalidSyntax =
      CLI.allArgs.length > 2 || CLI.allArgs.length == 1 || CLI.hasInvalidFlags(1);
    if (hasInvalidSyntax) {
      Logger.error('Invalid Syntax');
      Logger.chainInfo(['', ...help.getFindAnimeHelp()]);
      process.exit(1);
    }
    return true;
  }

  static tryRSSFlag() {
    const isValidFlag = CLI.hasShortFlag('rss') || CLI.hasLongFlag('rss-feed');
    if (!isValidFlag) return false;
    const hasInvalidSyntax =
      CLI.allArgs.length > 2 || CLI.allArgs.length == 1 || CLI.hasInvalidFlags(1);
    if (hasInvalidSyntax) {
      Logger.error('Invalid Syntax');
      Logger.chainInfo(['', ...help.getRSSFeedHelp()]);
      process.exit(1);
    }
    return true;
  }

  static tryFlag(flag: ValidLongFlags) {
    switch (flag) {
      case 'cache':
        return CLI.tryCacheFlag();
      case 'rebuild-cache':
        return CLI.tryRebuildCacheFlag();
      case 'find-anime':
        return CLI.tryFindAnimeFlag();
      case 'profile':
        return CLI.tryProfileFlag();
      case 'rss-feed':
        return CLI.tryRSSFlag();
    }
  }

  static getAllFlags = () => {
    const hasSingleOrDoubleDash = (arg: string) => arg.indexOf('-') == 0 && arg[2] != '-';
    return CLI.allArgs.filter(hasSingleOrDoubleDash);
  };

  static getShortFlags = () => {
    const hasSingleDash = (arg: string) => arg.indexOf('-') == 0 && arg[1] != '-';
    return CLI.allArgs.filter(hasSingleDash);
  };

  static getLongFlags = () => {
    const hasDoubleDash = (arg: string) => arg.indexOf('--') == 0 && arg[2] != '-';
    return CLI.allArgs.filter(hasDoubleDash);
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

  static hasInvalidFlags(num: number) {
    return CLI.getAllFlags().length > num;
  }

  static hasArgs() {
    return this.allArgs.length > 1;
  }
}
