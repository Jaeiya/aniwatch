import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Logger } from '../../logger.js';
import { watchAnime } from '../../watch.js';

const { h1, h2, nl, i2 } = Help.display;

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
        h2(`Default Syntax`),
        nl(`;by;wak ;y;<name> <ep> <fep>`),
        '',
        h2(`Details`),
        nl(`;y;name   ;x;Full or partial name of an existing anime on disk.`),
        ' ',
        nl(`;y;ep     ;x;Episode number of anime ;y;<name> ;x;on disk.`),
        ' ',
        nl(`;y;fep    ;m;(Optional) ;x;Update Kitsu progress with ;y;<fep>`),
        nl(i2(`;x;instead of ;y;<ep>;bk;.`)),
        '',
        h2(`Examples`),
        nl(`;by;wak ;y;"boku no hero" 10`),
        nl(`;by;wak ;y;berserk 3`),
        nl(`;by;wak ;y;bleach 367 1`),
    ];

    helpDisplay: string[] = [
        h1(`Default Usage`),
        nl(`Scan the current working directory for the`),
        nl(`specified anime ;y;name ;bk;and ;y;ep;bk;isode number, then`),
        nl(`updates your progress on Kitsu for that anime`),
        nl(`at the ;y;ep;bk;isode number you specified.`),
        '',
        nl(`If the anime file on disk is using a different`),
        nl(`numbering schema than Kitsu, then you can use`),
        nl(`the ;y;f;bk;orced ;y;ep;bk;isode number: ;y;fep;bk;, to set episode`),
        nl(`progress manually. This will force Kitsu to update `),
        nl(`your progress to ;y;fep;bk;.`),
        '',
        nl(`;m;NOTE:;bk; If the ;y;name ;bk;you use returns multiple`),
        nl(`results, the program will display them and exit.`),
        nl(`This allows you to try again with a more specific`),
        nl(`;y;name;bk;.`),
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
                `;r;Invalid Syntax`,
                'Read the help below to learn the correct syntax:',
                '',
            ]);
            Help.displayHelp(this.helpSyntax);
            process.exit(1);
        }

        watchAnime(flagArgs[0], [flagArgs[1], flagArgs[2] || ''], process.cwd());
    }
}
