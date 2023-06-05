import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { watchAnime } from '../../watch.js';
import { Log } from '../../printer/printer.js';

export class DefaultFlag extends CLIFlag {
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

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Default Usage']],
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
            ['s', [null, '<name> <ep> <fep>']],
            null,
            ['h2', ['Details']],
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
        ];
    }

    exec(cli: typeof CLI) {
        const flagArgs = cli.nonFlagArgs;

        if (!cli.userArgs.length) {
            return;
        }

        if (flagArgs.length < 2 || flagArgs.length > 3) {
            _con.chainError([
                `;r;Invalid Syntax`,
                'Read the help below to learn the correct syntax:',
                '',
            ]);
            this.printSyntax();
            process.exit(1);
        }

        watchAnime(flagArgs[0], [flagArgs[1], flagArgs[2] || ''], process.cwd());
    }
}
