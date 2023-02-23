import readline from 'readline';

type ColorCode = keyof typeof _consoleColors;
const _maxTagLength = 10;

//*                                R   G   B
// TODO - Support RGB: \u001B[38;2;255;100;70m\u001B[1m<text>
// https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
const _consoleColors = {
    /** Black */
    k: '\u001B[30m',
    /** Bright Black */
    bk: '\u001B[90m',
    /** Bright White */
    bw: '\u001B[97m',
    /** Red */
    r: '\u001B[31m',
    /** Bright Red */
    br: '\u001B[91m',
    /** Dark Green */
    g: '\u001B[32m',
    /** Bright Green */
    bg: '\u001B[92m',
    /** Yellow */
    y: '\u001B[33m',
    /** Bright Yellow */
    by: '\u001B[93m',
    /** Blue */
    b: '\u001B[34m',
    /** Bright Blue */
    bb: '\u001B[94m',
    /** Magenta */
    m: '\u001B[35m',
    /** Bright Magenta */
    bm: '\u001B[95m',
    /** Cyan */
    c: '\u001B[36m',
    /** Bright Cyan */
    bc: '\u001B[96m',
    /** Clear */
    x: '\u001B[0m',
};

const _colorMap = (function () {
    const map = new Map();
    for (const key in _consoleColors) {
        const k = key as keyof typeof _consoleColors;
        map.set(k, _consoleColors[k]);
    }
    return map;
})();

export class Logger {
    static readonly consoleColors = _consoleColors;

    static info(msg: string) {
        log('info', msg, 'g');
    }

    static chainInfo(msgs: string[]) {
        msgs.forEach((msg) => {
            if (msg) {
                Logger.info(msg);
            } else {
                console.log('');
            }
        });
    }

    static error(msg: string) {
        log('error', msg, 'r');
    }

    static chainError(msgs: string[]) {
        msgs.forEach((msg) => {
            if (msg) {
                Logger.error(msg);
            } else {
                console.log('');
            }
        });
    }

    static promptRaw(msg: string) {
        return this.printRaw('m', 'prompt', msg);
    }

    static print(color: ColorCode, tag: string, msg: string) {
        log(tag, msg, color);
    }

    static printRaw(color: ColorCode, tag: string, msg: string) {
        return colorStr(`;${color};${toTag(tag)} ;x;${msg}`);
    }

    static async prompt(query: string) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const answer = await new Promise<string>((rs) => {
            // It's cleaner to have prompt spaced from prior logs
            console.log('');
            rl.question(Logger.promptRaw(query), rs);
        });
        rl.close();
        return answer;
    }
}

function log(tagName: string, msg: string, color: ColorCode) {
    console.log(colorStr(`;${color};${toTag(tagName)} ;x;${msg}`));
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

function colorStr(str: string) {
    if (!str.match(/;[a-z]{1,2};/g)) return str;

    let coloredStr = str;
    for (const [code, color] of _colorMap) {
        const colorCode = `;${code};`;
        if (str.includes(colorCode)) {
            coloredStr = coloredStr.replaceAll(colorCode, color);
        }
    }

    return coloredStr;
}
