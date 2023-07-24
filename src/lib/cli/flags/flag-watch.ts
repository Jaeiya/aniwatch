import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { watchAnime } from '../../watch.js';
import { Log, Printer } from '../../printer/printer.js';

export class DefaultFlag extends CLIFlag {
    name: CLIFlagName = ['m', 'manual'];
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

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Watch Usage']],
            [
                'p',
                'Scan the current working directory for the specified anime ;y;name ;bk;and ' +
                    ';y;ep;bk;isode number, then updates your progress on Kitsu for that anime ' +
                    'at the ;y;ep;bk;isode number you specified.',
            ],
            null,
            [
                'p',
                'If the anime file on disk is using a different numbering schema than ' +
                    'Kitsu, then you can use the ;y;f;bk;orced ;y;ep;bk;isode number: ' +
                    ';y;fep;bk;, to set episode progress manually.  This will force Kitsu ' +
                    'to update your progress to ;y;fep;bk;.',
            ],
            null,
            [
                'p',
                ';m;Manual Mode: ;bk;By default, this command executes without the need to ' +
                    'pass any flag to the program. If you pass the ;c;-m ;bk;or ;c;-manual ' +
                    ';bk;flags, then it activates manual mode, which ignores any physical file ' +
                    'requirements.',
            ],
            null,
            [
                'p',
                'In other words, if you just want to update Kitsu without moving or caring ' +
                    'about any existing files on disk, you can use manual mode. You use it ' +
                    'exactly the same way, except you pass the manual flag before the arguments.',
            ],
            null,
            [
                'p',
                ';m;NOTE: ;bk;If the ;y;name ;bk;you use returns multiple results, the program ' +
                    'will display them and exit. This allows you to try again with a more ' +
                    'specific ;y;name;bk;.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Default Syntax']],
            ['s', null, ';y;<?;x;[;c;-m ;x;| ;c;-manual;x;];y;> <name> <ep> <?fep>'],
            null,
            ['h2', ['Details']],
            [
                'cd',
                [
                    'm',
                    ';m;(optional) ;x;Enables Manual mode. Read description above for details',
                ],
                2,
            ],
            null,
            ['d', ['name', 'Full or partial name of an existing anime on disk.']],
            null,
            ['d', ['ep', 'Episode number of anime ;y;<name> ;x;on disk.'], 2],
            null,
            [
                'd',
                [
                    'fep',
                    ';m;(optional) ;x;Update Kitsu progress with ;y;<fep> instead of ;y;<ep>;bk;.',
                ],
                1,
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['', `"boku no hero" 10`]],
            ['e', ['', 'berserk 3']],
            ['e', ['', 'bleach 367 1']],
            ['e', ['m', 'boku 20']],
            ['e', ['manual', 'boku 20']],
        ];
    }

    async exec(cli: typeof CLI) {
        const flagArgs = cli.nonFlagArgs;

        if (!cli.userArgs.length) {
            const helpFlag = cli.flags.find((f) => f.name.includes('help'));
            if (helpFlag) {
                Printer.print([null, null]);
                helpFlag.printHelp();
            }
            return;
        }

        if (flagArgs.length < 2 || flagArgs.length > 3) {
            Printer.printError(
                'Read the help below to learn the correct syntax:',
                'Invalid Syntax'
            );
            this.printHelp();
            process.exit(1);
        }

        const [epName, epNumber, epForcedNum] = flagArgs;

        if (epName.length < 3) {
            Printer.printWarning(
                'Episode names must be longer than 2 characters.',
                'Invalid Name'
            );
            return;
        }

        if (isNaN(parseInt(epNumber))) {
            Printer.printError(
                `You entered an invalid Episode Number: ;x;${epNumber}`,
                'Invalid Number'
            );
            Printer.print([null, null]);
            this.printSyntax();
            return;
        }

        if (epForcedNum && isNaN(parseInt(epForcedNum))) {
            Printer.printError(
                `You entered an invalid ;bw;Forced ;y;Episode Number: ;x;${epForcedNum}`,
                'Invalid Number'
            );
            Printer.print([null, null]);
            this.printSyntax();
            return;
        }

        Printer.print([null]);
        const stopLoader = Printer.printLoader('Setting Progress');
        const { completed, anime } = await watchAnime(
            epName,
            [epNumber, epForcedNum || '0'],
            process.cwd(),
            !!cli.flagArgs.length // is it --manual entry?
        );
        const { epCount, epProgress, jpTitle, enTitle } = anime;
        stopLoader();

        Printer.print([['h3', ['Setting Progress']]]);

        const percent = epCount ? Math.floor((epProgress / epCount) * 100) : 0;
        const percentText = percent ? `;bk;(;c;~${percent}%;bk;)` : '';
        const progressText = completed
            ? ';bg;Completed!'
            : `;bg;${epProgress} ;x;/ ;y;${epCount || ';r;Unknown'} ${percentText}`;

        Printer.printInfo(
            [
                `JP Title: ;x;${jpTitle || ';m;None'}`,
                `EN Title: ;bk;${enTitle || ';m;None'}`,
                `Progress: ${progressText}`,
            ],
            'Success',
            3
        );
    }
}
