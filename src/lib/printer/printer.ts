import { createSpinner } from '../cli/cli-spinner.js';
import { pathBasename } from '../utils.js';
import { PrinterColor } from './print-colors.js';
import { inspect } from 'util';

export type Log =
    | LogBasic
    | LogHeader
    | LogParagraph
    | LogProperty
    | LogCommandDefinition
    | LogSyntax
    | LogCommandExample
    | LogBorder
    | null;

type LogBasic = [kind: '', message: string] | [kind: '', message: string, marginOffset: number];
type LogHeader =
    | [kind: 'h1' | 'h2' | 'h3', message: [header: string] | [header: string, message: string]]
    | [
          kind: 'h1' | 'h2' | 'h3',
          message: [header: string] | [header: string, message: string],
          marginOffset: number
      ];
type LogParagraph =
    | [kind: 'p', message: string, marginOffset: number]
    | [kind: 'p', message: string];
type LogProperty =
    | [kind: 'py', message: [property: string, value: string], marginOffset: number]
    | [kind: 'py', message: [property: string, value: string]];
type LogCommandDefinition =
    | [kind: 'd' | 'cd', message: [word: string, definition: string], marginOffset: number]
    | [kind: 'd' | 'cd', message: [word: string, definition: string]];
type LogSyntax = [kind: 's', message: [commands: string[] | null, args: string]];
type LogCommandExample = [kind: 'e', message: [command: string, example: string]];
type LogBorder = [kind: 'hl', message: string, length: number, marginOffset?: number];

const _leftLogMargin = 3;
const _defaultIndent = 3;
const _maxLogLength = 70;
const _colorText = PrinterColor.colorText;

export class Printer {
    static printWarning(message: string, header?: string, marginOffset = 0) {
        this.print([
            ['h1', [`;by;${header ?? 'WARNING'}`], marginOffset],
            ['p', `;c;${message}`, marginOffset],
        ]);
    }

    static printError(message: string, header?: string, marginOffset = 0) {
        this.print([
            ['h1', [`;r;${header ?? 'ERROR'}`], marginOffset],
            ['p', `;y;${message}`, marginOffset],
        ]);
    }

    static printInfoBlock(messages: string[], header?: string) {
        this.printBlock({ headColor: 'g', msgColor: 'x' }, header ?? 'INFO', messages);
    }

    static printErrorBlock(messages: string[], header?: string) {
        this.printBlock({ headColor: 'r', msgColor: 'y' }, header ?? 'ERROR', messages);
    }

    static printWarningBlock(messages: string[], header?: string) {
        this.printBlock({ headColor: 'y', msgColor: 'c' }, header ?? 'WARNING', messages);
    }

    static printBlock(
        colorCodes: { headColor: string; msgColor: string },
        header: string,
        messages: string[]
    ) {
        const { headColor, msgColor } = colorCodes;
        const border = '─'.repeat(_maxLogLength + _leftLogMargin * 2);
        const logs: Log[] = [null, null, ['', `;${headColor};${header}:`], ['', `${border}`]];
        messages.forEach((m) => logs.push(['p', `;${msgColor};${m}`]));
        logs.push(['', `;${headColor};${border};x;`], null);
        this.print(logs);
    }

    static print(logs: Log[]) {
        logs.forEach((log) => {
            printLog(log);
        });
    }

    static log(msg: string, padding = 0) {
        console.log(`${createFixedWidthSentences(msg, padding)}`);
    }

    static debug(...args: any[]) {
        const stack = Error('').stack;
        if (!stack) return;
        const [offender, filePath, lineNumber] = getStackInfo(stack);
        this.print([
            null,
            null,
            ['h1', [';br;DEBUG']],
            ['p', `;br;${'─'.repeat(65)};x;\n`],
            null,
        ]);
        [...args].forEach((a) =>
            console.log(inspect(a, { showHidden: true, depth: null, colors: true }))
        );
        this.print([
            null,
            ['p', `;br;${'─'.repeat(65)};x;\n`],
            [
                'p',
                `;g;Exec ;x;by ;g;${offender || 'root'} ;x;in file ;g;${pathBasename(
                    filePath
                )} ;x;at line ;m;${lineNumber}`,
            ],
            null,
            null,
        ]);
        console.log('');
    }
}

function printLog(log: Log) {
    if (log == null) return console.log('');

    const [kind, message, margin] = log;
    const marginOffset = margin ?? 0;

    switch (kind) {
        case '':
            return console.log(
                applyLogMargin(_colorText(message), _defaultIndent + marginOffset)
            );

        case 'hl':
            return console.log(getBorderLog(log));

        case 'h1':
        case 'h2':
        case 'h3':
            return console.log(getHeaderLog(log));

        case 'p':
            return console.log(getParagraphLog(log));

        case 'py':
            return console.log(getPropertyLog(log));

        case 'e':
            return console.log(getExampleLog(log));

        case 's':
            return console.log(getSyntaxLog(log));

        case 'd':
            return console.log(getDefinitionLog(log));

        default:
            throw Error(`Invalid Log Kind: "${kind}"`);
    }
}

function getBorderLog(log: LogBorder) {
    const [, message, borderLength, extraMargin] = log;
    return applyLogMargin(
        _colorText(`${message}${'─'.repeat(borderLength)}`),
        _leftLogMargin + (extraMargin || 0)
    );
}

function getHeaderLog(log: LogHeader) {
    const [kind, headerData, marginOffset] = log;
    const [header, text] = headerData;

    if (
        header.length > _maxLogLength ||
        (text && text.length + header.length > _maxLogLength)
    ) {
        throw Error('headers cannot be larger than max log length');
    }

    const headerColor = kind == 'h1' ? ';bw;' : ';b;';
    const styledHeader =
        kind == 'h1' || kind == 'h2'
            ? `${headerColor}${header}:;x; ${text ?? ''}`
            : `;bg;... ;bb;${header} ;bg;...;x;`;

    return _colorText(applyLogMargin(styledHeader, _leftLogMargin + (marginOffset ?? 0)));
}

function getParagraphLog(log: LogParagraph) {
    const [, message, marginOffset] = log;
    return _colorText(
        createFixedWidthSentences(`;bk;${message}`, _defaultIndent + (marginOffset ?? 0)).join(
            '\n'
        )
    );
}

function getPropertyLog(log: LogProperty) {
    const [, message, margin] = log;
    const marginOffset = margin ?? 0;
    const [prop, val] = message;
    const sentences = createFixedWidthSentences(
        `;bk;${val}`,
        prop.length + 2 + marginOffset + _leftLogMargin
    );
    sentences[0] = `;c;${prop}: ${sentences[0].trimStart()}`;
    return _colorText(
        applyLogMargin(sentences.join('\n'), _leftLogMargin + _defaultIndent + marginOffset)
    );
}

function getExampleLog(log: LogCommandExample) {
    const [, message] = log;
    const [command, example] = message;
    return applyLogMargin(
        _colorText(`;by;wak;c;${command ? ` -${command}` : ''} ;y;${example}`),
        _leftLogMargin + _defaultIndent
    );
}

function getSyntaxLog(log: LogSyntax) {
    const [, message] = log;
    const [commands, args] = message;
    const resolvedMessage = commands
        ? `;by;wak ;bk;[${commands
              .map((c) => `;c;${c ? ` -${c}` : ''};x;`)
              .join(' ;bk;|')} ;bk;] ;y;${args};x;`
        : `;by;wak ;y;${args}`;

    return applyLogMargin(_colorText(resolvedMessage), _leftLogMargin + _defaultIndent);
}

function getDefinitionLog(log: LogCommandDefinition) {
    const [kind, message, offset] = log;
    const [word, definition] = message;
    const defaultOffset = offset ?? 0;
    const wordLength = word.length;
    const [firstSentence, ...leftoverSentences] = createFixedWidthSentences(
        definition,
        0,
        _maxLogLength - wordLength - 10
    );
    const newFirst = applyLogMargin(
        `${kind == 'cd' ? ';c;-' : ';y;'}${word}   ;x;${firstSentence.trim()}`,
        _leftLogMargin + _defaultIndent + defaultOffset
    );

    const paddedSentences = leftoverSentences.map((s) =>
        applyLogMargin(
            s,
            wordLength + _defaultIndent * 2 + defaultOffset + (kind == 'cd' ? 1 : 0)
        )
    );

    return _colorText([newFirst, ...paddedSentences].join('\n'));
}

function createFixedWidthSentences(text: string, margin = 0, logLength = _maxLogLength) {
    const words = text.replaceAll('\n', ' ').split(' ');

    const paragraph = [];
    const stripColors = PrinterColor.stripColorCodes;
    let sentence = '';

    while (words.length) {
        if (words[0].length > logLength) {
            throw Error(`Cannot paragraph a word longer than line length: "${words[0]}"`);
        }
        const word = stripColors(words[0]);
        if (word.length + stripColors(sentence).length <= logLength) {
            sentence += `${words[0]} `;
            words.splice(0, 1);
            if (!words.length) {
                paragraph.push(sentence.trim());
            }
            continue;
        }
        paragraph.push(sentence.trim());
        sentence = '';
    }
    return paragraph.map((v) => applyLogMargin(v, _leftLogMargin + margin));
}

function applyLogMargin(text: string, leftMargin = _leftLogMargin) {
    return `${' '.repeat(leftMargin)}${text}`;
}

function getStackInfo(stack: string) {
    const stackLines = stack.split('\n');
    if (!stackLines.length || stackLines[1].trim().indexOf('at ') != 0) {
        throw Error('not a stack trace');
    }
    const hasSourceMap = stack.includes('.ts:');
    const pathLines = stackLines.map((l) => l.trim().replace('file:///', ''));
    // Remove "Error" and Logger{} lines
    pathLines.splice(0, 2);
    const execLine = pathLines[0];
    const offenderFunc = execLine.includes(' (')
        ? execLine.split(' (')[0].replace('at ', '')
        : '';
    const [path, lineNumber] = execLine
        .split(hasSourceMap ? ':\\' : ':/')[1]
        .split(':')
        .map((v) => v.replace(')', ''));
    return [offenderFunc, pathBasename(path), lineNumber] as const;
}
