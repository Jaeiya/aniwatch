const _maxTagLength = 10;

const _consoleColors = {
  /** Red */
  rd: '\u001B[31m',
  /** Bright Red */
  brd: '\u001B[91m',
  /** Dark Green */
  gn: '\u001B[32m',
  /** Bright Green */
  bgn: '\u001B[92m',
  /** Yellow */
  yw: '\u001B[33m',
  /** Bright Yellow */
  byw: '\u001B[93m',
  /** Blue */
  be: '\u001B[34m',
  /** Bright Blue */
  bbe: '\u001B[94m',
  /** Magenta */
  ma: '\u001B[35m',
  /** Bright Magenta */
  bma: '\u001B[95m',
  /** Cyan */
  cn: '\u001B[36m',
  /** Bright Cyan */
  bcn: '\u001B[96m',
  /** Bright White */
  bwt: '\u001B[97m',
  /** Clear */
  x: '\u001B[0m',
};
const _cc = _consoleColors;

export class Logger {
  static readonly consoleColors = _consoleColors;

  static info(msg: string) {
    log('info', msg, 'gn');
  }

  static error(msg: string) {
    log('error', msg, 'rd');
  }

  static print(color: keyof typeof _cc, tag: string, msg: string) {
    log(tag, msg, color);
  }

  static printRaw(color: keyof typeof _cc, tag: string, msg: string) {
    return `${_cc[color]}${toTag(tag)}${_cc.x} ${msg}`;
  }
}

function log(tagName: string, msg: string, color: keyof typeof _cc) {
  console.log(`${_cc[color]}${toTag(tagName)}${_cc.x}`, msg);
}

function toTag(tagName: string) {
  if (tagName.length > _maxTagLength) {
    throw Error(`Tag longer than maxTagLength: [${tagName}]`);
  }
  const specialCharLength = 3; // [, ], :
  const tagLength = tagName.length + specialCharLength;
  const offsetLength = _maxTagLength - tagLength;
  return `${' '.repeat(offsetLength)}[${tagName.toUpperCase()}]:`;
}
