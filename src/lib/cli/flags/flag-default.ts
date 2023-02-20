import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Logger } from '../../logger.js';
import { watchAnime } from '../../watch.js';

const { h1, h2, x, arg, em, ex, d } = Help.colors;
const { nl, ind2 } = Help.textFlowUtils;
const _cc = Logger.consoleColors;

export class DefaultFlag implements CLIFlag {
    name: CLIFlagName = ['', 'default'];
    type: CLIFlagType = 'multiArg';
    isDefault = true;

    helpAliases: string[] = [
        ...this.name,
        'normal',
        'normal usage',
        'basic',
        'basic usage',
        'how to use',
        'how to use program',
        'how do I use program',
        'how do I watch anime',
        'how do I update kitsu',
    ];

    helpSyntax: string[] = [
        `${h2}Default Syntax:`,
        `${nl}${ex}wak ${arg}<name> <ep> <fep>`,
        '',
        `${h2}Details:${nl}`,
        `${nl}${arg}name${x}   Full or partial name of an existing anime on disk.`,
        ' ',
        `${nl}${arg}ep${x}     Episode number of anime ${arg}<name>${x} on disk.`,
        ' ',
        `${nl}${arg}fep${x}    ${em}(Optional)${x} Update Kitsu progress with ${arg}<fep>`,
        `${ind2}${x}    instead of ${arg}<ep>${d}.`,
        '',
        `${h2}Examples:`,
        `${nl}${ex}wak ${arg}"boku no hero" 10`,
        `${nl}${ex}wak ${arg}berserk 3`,
        `${nl}${ex}wak ${arg}bleach 367 1`,
    ];

    helpDisplay: string[] = [
        `${h1}Default Usage`,
        `${nl}Scan the current working directory for the`,
        `${nl}specified anime ${arg}name ${d}and ${arg}ep${d}isode number, then`,
        `${nl}updates your progress on Kitsu for that anime`,
        `${nl}at the ${arg}ep${d}isode number you specified.`,
        '',
        `${nl}If the anime file on disk is using a different`,
        `${nl}numbering schema than Kitsu, then you can use`,
        `${nl}the ${arg}f${d}orced ${arg}ep${d}isode number: ${arg}fep${d}, to set episode`,
        `${nl}progress manually. This will force Kitsu to update `,
        `${nl}your progress to ${arg}fep${d}.`,
        '',
        `${nl}${_cc.ma}NOTE:${d} If the ${arg}name ${d}you use returns multiple`,
        `${nl}results, the program will display them and exit.`,
        `${nl}This allows you to try again with a more specific`,
        `${nl}${arg}name${d}.`,
        '',
        ...this.helpSyntax,
    ];

    exec(cli: typeof CLI) {
        const flagArgs = cli.nonFlagArgs;

        if (!cli.userArgs.length && Kitsu.isFirstSetup) {
            return;
        }

        if (flagArgs.length < 2 || flagArgs.length > 3) {
            Logger.chainError([
                `${_cc.rd}Invalid Syntax`,
                'Read the help below to learn the correct syntax:',
                '',
            ]);
            Help.displayHelp(this.helpSyntax);
            process.exit(1);
        }

        watchAnime(flagArgs[0], [flagArgs[1], flagArgs[2] || ''], process.cwd());
    }
}
