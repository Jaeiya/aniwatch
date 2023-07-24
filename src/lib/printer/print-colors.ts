import { Config } from '../config.js';

export type ColorCode = keyof typeof _consoleColors;
type HexColor = string;

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
    /** Default Color */
    x: '\u001B[39m',
    /** Default Background Color */
    xbg: '\u001B[49m',
    /** Reset All */
    xx: '\u001B[0m',
    ul: '\u001B[4m',
};

const _colorCodeMap = (function () {
    const map = new Map<string, string>();
    for (const key in _consoleColors) {
        const k = key as ColorCode;
        map.set(k, _consoleColors[k]);
    }
    return map;
})();

export class PrinterColor {
    static colorText(text: string) {
        return replaceColorCodes(text, Config.get('useColor') ? undefined : '');
    }

    static stripColorCodes(text: string) {
        return replaceColorCodes(text, '');
    }

    static addCustomColor(code: string, color: HexColor) {
        const [r, g, b] = toRGBFromHex(color);
        if (code.length > 3) {
            throw Error('color code must be between 1 and 3 characters long');
        }
        if (_colorCodeMap.has(code)) {
            throw Error(`color code "${code}" already exists`);
        }
        _colorCodeMap.set(code, `\u001B[38;2;${r};${g};${b}m`);
    }
}

function replaceColorCodes(text: string, replacement?: string) {
    const colorCodes = text.match(/;([a-z]){1,3};/g);
    if (!colorCodes) return text;

    const invalidCodes = colorCodes.filter((c) => !_colorCodeMap.has(c.replaceAll(';', '')));
    if (invalidCodes.length) {
        throw Error(`invalid color code(s) "${invalidCodes}"`);
    }

    for (const [code, color] of _colorCodeMap) {
        const colorCode = `;${code};`;
        if (text.includes(colorCode)) {
            text = text.replaceAll(colorCode, replacement ?? color);
        }
    }
    return text;
}

function toRGBFromHex(hex: string) {
    // Match hex codes: FF00FF or FFF case insensitive
    const hexMatcher = /^[0-9a-f]{6}|[0-9a-f]{3}$/gi;
    if (!hexMatcher.test(hex)) {
        throw Error('invalid hex color');
    }
    const fullHex = hex.length > 3 ? hex : [...hex].map((c) => c + c).join('');
    const intFromHex = parseInt(fullHex, 16);
    return [(intFromHex >> 16) & 0xff, (intFromHex >> 8) & 0xff, intFromHex & 0xff];
}

/**
 * Takes a string and adds the color code to any words
 * where a substring of the word can be found.
 *
 * @param str The string to use to lookup the `word`
 * @param word The word to find within the `string`
 * @param color The color-code to use as the `word` color
 * @param defaultColor The default color-code of the `string`
 */
export function colorWord(
    str: string,
    word: string,
    color: ColorCode,
    defaultColor: ColorCode
) {
    return str
        .split(' ')
        .map((p) => {
            if (p.toLowerCase().includes(word.toLowerCase())) {
                return `;${color};${p};${defaultColor};`;
            }
            return p;
        })
        .join(' ');
}
