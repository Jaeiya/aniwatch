import { CLIFlagName } from './cli/cli.js';
import { Logger } from './logger.js';
import { fitStringEnd } from './utils.js';

const _cc = Logger.consoleColors;
/** ANSI Clear Char */
const _x = _cc.x;
/** ANSI Bright Black */
const _blk = _cc.bbk;
/** ANSI Heading Color */
const _hd = _cc.bwt;
/** ANSI Subheading Color */
const _shd = _cc.bma;
/** ANSI Flag Color */
const _fl = _cc.bcn;
/** 3-Spaced Line */
const _ind1 = ' '.repeat(3);
/** 6-Spaced Line */
const _ind2 = ' '.repeat(6);
/** New Line */
const _nl = `${_ind1}${_blk}`;

type SimpleHelpTuple = [shortHelp: string, longHelp: string[]];
type HelpTuple = [aliases: string[], help: string[]];

const _advancedFlagHelp: HelpTuple[] = [];
const _simpleFlagHelp: HelpTuple[] = [];
const _simpleFlagSyntax: string[] = [`${_shd}Syntax:`];
const _simpleFlagDetails: string[] = [`${_shd}Details:`];
const _simpleFlagExamples: string[] = [`${_shd}Examples:`];

export class Help {
    static readonly colors = {
        /** ANSI Clear Char */
        x: _cc.x,
        /** Default */
        d: _cc.bbk,
        /** Executing Program */
        ex: _cc.byw,
        /** Emphasis */
        em: _cc.ma,
        /** Heading 1*/
        h1: _cc.bwt,
        /** Heading 2*/
        h2: _cc.bma,
        /** Flag */
        f: _cc.bcn,
        /** Argument */
        arg: _cc.yw,
    };

    static readonly textFlowUtils = {
        /** 3-Spaced Indent */
        ind1: _ind1,
        /** 6-Spaced Indent */
        ind2: _ind2,
        /** New Line */
        nl: `${_ind1}${_blk}`,
    };

    static displaySimpleHelp() {
        const help = [
            `${_hd}Simple Flag Usage`,
            `${_nl}These are flags that can only be used by themselves`,
            `${_nl}without arguments. If an attempt is made to use them`,
            `${_nl}with other flags or arguments, an error will occur.`,
            '',
            ..._simpleFlagSyntax,
            '',
            ..._simpleFlagDetails,
            ..._simpleFlagExamples,
        ];
        this.displayHelp(help);
    }

    static displayAllHelp() {
        const spacedComplexHelp = _advancedFlagHelp.map((h) => [...h[1], '', '', '']);
        this.displayHelp(spacedComplexHelp.flat());
        this.displaySimpleHelp();
    }

    static displayAdvancedFlagHelp() {
        _advancedFlagHelp.forEach((h) => {
            this.displayHelp(h[1]);
        });
    }

    static addSimpleHelp(aliases: string[], flags: CLIFlagName, help: SimpleHelpTuple) {
        const [shortHelp, longHelp] = help;
        _simpleFlagHelp.push([aliases, [...longHelp, ...getNoArgSyntax(flags)]]);
        this.addFlagSyntax(flags, shortHelp);
        this.addSimpleFlagExamples(flags);
    }

    static addFlagSyntax(flags: [string, string], shortHelp: string) {
        const shortFlag = fitStringEnd(flags[0], 3);
        const longFlag = fitStringEnd(flags[1], 15);
        const flagExample = `${_fl}-${shortFlag}${_x}| ${_fl}--${longFlag}${_x}`;

        _simpleFlagSyntax.push(
            _simpleFlagSyntax.length == 1
                ? `${_nl}${_cc.byw}wak ${_x}[ ${flagExample} ]`
                : `${_ind2} [ ${flagExample} ]`
        );

        _simpleFlagDetails.push(`${_nl}${_fl}-${fitStringEnd(flags[0], 4)}${_x} ${shortHelp}`, '');
    }

    static addSimpleFlagExamples(flags: [string, string]) {
        const getExampleLine = (flag: string) => `${_nl}${_cc.byw}wak ${_fl}${flag}`;
        if (_simpleFlagExamples.length < 5) {
            _simpleFlagExamples.push(`${getExampleLine(`-${flags[0]}`)}`);
            _simpleFlagExamples.push(`${getExampleLine(`--${flags[1]}`)}`);
        }
    }

    static addAdvancedFlagHelp(aliases: string[], help: string[]) {
        _advancedFlagHelp.push([aliases, help]);
    }

    static findHelp(alias: string) {
        const allHelp = _simpleFlagHelp.concat(_advancedFlagHelp);
        const helpTuple = allHelp.find((h) => h[0].includes(alias));
        if (!helpTuple) return undefined;
        return helpTuple[1];
    }

    static displayHelp(helpStrings: string[]) {
        Logger.chainInfo(helpStrings);
    }
}

function getNoArgSyntax(flags: [string, string]) {
    const [short, long] = flags;
    return [
        `${_shd}Default Syntax:`,
        `${_nl}${_cc.byw}wak ${_x}[${_fl}-${short} ${_x}| ${_fl}--${long}${_x}]`,
        '',
        `${_shd}Examples:`,
        `${_nl}${_cc.byw}wak ${_fl}-${short}`,
        `${_nl}${_cc.byw}wak ${_fl}--${long}`,
    ];
}
