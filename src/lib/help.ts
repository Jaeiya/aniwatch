import { CLIFlagName } from './cli/cli.js';
import { fitStringEnd } from './utils.js';

type SimpleHelpTuple = [shortHelp: string, longHelp: string[]];
type HelpTuple = [aliases: string[], help: string[]];
const _display = {
    /**
     * Header **Level 1** Displays string with trailing colon and
     * **Bright White** color
     */
    h1: (header1: string) => `;bw;${header1}:`,
    /**
     * Header **Level 2** displays string with trailing colon and
     * **Bright Magenta** color
     */
    h2: (header2: string) => `;bm;${header2}:`,
    /** Indent **level 1** with Bright Black color */
    i1: (line: string) => `${' '.repeat(3)};bk;${line}`,
    /** Indent **level 2** with Bright Black color */
    i2: (line: string) => `${' '.repeat(6)};bk;${line}`,
    /** Indent **level 3** with Bright Black color */
    i3: (line: string) => `${' '.repeat(9)};bk;${line}`,
    /** Indent **level 4** with Bright Black color */
    i4: (line: string) => `${' '.repeat(12)};bk;${line}`,
    /** Indented Line with Bright Black color (signifies
     * **new line** when used after help header) */
    nl: (line: string) => _display.i1(`;bk;${line}`),
};
const { h1, h2, nl, i2 } = _display;

const _advancedFlagHelp: HelpTuple[] = [];
const _simpleFlagHelp: HelpTuple[] = [];
const _simpleFlagSyntax: string[] = [h2(`Syntax`)];
const _simpleFlagDetails: string[] = [h2(`Details`)];
const _simpleFlagExamples: string[] = [h2(`Examples`)];

export class Help {
    static readonly display = _display;

    static displaySimpleHelp() {
        const help = [
            h1(`Simple Flag Usage`),
            nl(`These are flags that can only be used by themselves`),
            nl(`without arguments. If an attempt is made to use them`),
            nl(`with other flags or arguments, an error will occur.`),
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
        const flagExample = `;bc;-${shortFlag};x;| ;bc;--${longFlag};x;`;

        _simpleFlagSyntax.push(
            _simpleFlagSyntax.length == 1
                ? nl(`;by;wak ;x;[ ${flagExample} ]`)
                : i2(`[ ${flagExample} ]`)
        );

        _simpleFlagDetails.push(nl(`;bc;-${fitStringEnd(flags[0], 4)} ;x;${shortHelp}`), '');
    }

    static addSimpleFlagExamples(flags: [string, string]) {
        const getExampleLine = (flag: string) => nl(`;by;wak ;bc;${flag}`);
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
        _con.chainInfo(helpStrings);
    }
}

function getNoArgSyntax(flags: [string, string]) {
    const [short, long] = flags;
    return [
        h2(`Default Syntax`),
        nl(`;by;wak ;x;[;bc;-${short} ;x;| ;bc;--${long};x;]`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-${short}`),
        nl(`;by;wak ;bc;--${long}`),
    ];
}
