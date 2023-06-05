import { createSpinner } from '../cli/cli-spinner.js';
import { pathBasename } from '../utils.js';
import { PrinterColor } from './print-colors.js';
import { inspect } from 'util';

export type Log =
    | LogBasic
    | LogHeader
    | LogParagraph
    | LogCommandDefinition
    | LogSyntax
    | LogCommandExample
    | null;

type LogBasic = [kind: '', message: string];
type LogHeader = [
    kind: 'h1' | 'h2',
    message: [header: string] | [header: string, message: string]
];
type LogParagraph =
    | [kind: 'p', message: string, marginOffset: number]
    | [kind: 'p', message: string];
type LogCommandDefinition =
    | [kind: 'd' | 'cd', message: [word: string, definition: string], marginOffset: number]
    | [kind: 'd' | 'cd', message: [word: string, definition: string]];
type LogSyntax = [kind: 's', message: [commands: string[], args: string]];
type LogCommandExample = [kind: 'e', message: [command: string, example: string]];

const _leftLogMargin = 3;
const _defaultIndent = 3;
const _maxLogLength = 70;
const _colorText = PrinterColor.colorText;

export class Printer {
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

    const [kind, message, padding] = log;
    const realPadding = padding ?? 0;

    if (kind == '') {
        return console.log(applyLogMargin(_colorText(message)));
    }

    if (kind == 'h1' || kind == 'h2') {
        const [header, headerMsg] = message;
        if (
            header.length > _maxLogLength ||
            (headerMsg && headerMsg.length + header.length > _maxLogLength)
        ) {
            throw Error('headers cannot be larger than max log length');
        }
        return console.log(
            _colorText(
                applyLogMargin(
                    `${kind == 'h1' ? ';bw;' : ';b;'}${header}:;x; ` + (headerMsg ?? '')
                )
            )
        );
    }

    if (kind == 'p') {
        return console.log(
            _colorText(
                createFixedWidthSentences(`;bk;${message}`, _defaultIndent + realPadding).join(
                    '\n'
                )
            )
        );
    }

    if (kind == 'e') {
        const [command, example] = message;
        return console.log(
            applyLogMargin(
                _colorText(`;by;wak ;c;-${command} ;y;${example}`),
                _leftLogMargin + _defaultIndent
            )
        );
    }

    if (kind == 's') {
        const [commands, args] = message;

        const resolvedMessage = commands
            ? `;by;wak ;bk;[${commands
                  .map((c) => `;c;${c ? ` -${c}` : ''};x;`)
                  .join(' ;bk;|')} ;bk;] ;y;${args};x;`
            : `;by;wak ;y;${args}`;

        return console.log(
            applyLogMargin(_colorText(resolvedMessage), _leftLogMargin + _defaultIndent)
        );
    }

    if (kind == 'd' || kind == 'cd') {
        return printDefinitionLog(log);
    }

    if (kind == '') {
        return console.log(_colorText(applyLogMargin(message)));
    }

    throw Error('invalid log');
}

function printDefinitionLog(log: LogCommandDefinition) {
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

    console.log(_colorText([newFirst, ...paddedSentences].join('\n')));
}

function createFixedWidthSentences(text: string, margin = 0, logLength = _maxLogLength) {
    const words = text.split(' ');

    const paragraph = [];
    const stripColors = PrinterColor.stripColorCodes;
    let sentence = '';

    while (words.length) {
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
