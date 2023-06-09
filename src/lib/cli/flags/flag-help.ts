import { Log, Printer } from '../../printer/printer.js';
import { fitStringEnd } from '../../utils.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

export class HelpFlag extends CLIFlag {
    name: CLIFlagName = ['h', 'help'];
    type: CLIFlagType = 'multiArg';

    helpAliases = [...this.name, 'need help', 'how to use help'];

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Help']],
            [
                'p',
                ';m;About: ;bk;This is Wakitsu, which is just a combination of the words ' +
                    ';x;watch ;bk;and ;x;kitsu;bk;; a command line utility for ' +
                    'interacting with Kitsu.io. It allows you to update your watch list, ' +
                    'find anime, or add anime to your watch list, to name a few of its ' +
                    'functions.',
            ],
            null,
            [
                'p',
                ';m;Usage: ;bk;The best place to start is to look at the examples below and ' +
                    'test out the described command behavior.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['h', 'help'], '<all|simple|flag|desc>'],
            null,
            ['h2', ['Details']],
            ['d', ['all', 'Displays all available help entries (Huge List).'], 3],
            null,
            ['d', ['simple', 'Displays help for all basic commands.']],
            null,
            ['d', ['flag', 'The name of an existing flag that you want more help with'], 2],
            null,
            ['d', ['desc', 'Description of the action you want help for.'], 2],
            null,
            ['h2', ['Examples']],
            ['e', ['h', 'all']],
            ['e', ['h', 'find anime']],
            ['e', ['h', 'cache']],
            ['e', ['h', 'basic usage']],
            ['e', ['h', 'show profile']],
            ['e', ['h', 'reload cache']],
            null,
            ['h2', ['Broad Explanation']],
            [
                'p',
                'When using the ;y;desc ;bk;argument, think of the event ' +
                    `you're trying to get help with. If you want to know how ` +
                    `to lookup an existing anime, you could type something like ` +
                    `;x;search anime ;bk;or ;x;lookup anime ;bk;as a ;y;desc ;bk;argument.`,
            ],
            null,
            [
                'p',
                `There's still a possibility that you type in an unknown description, ` +
                    `but if you think about it long enough, you should be able to figure ` +
                    `out a known description for the functionality you're lacking.`,
            ],
        ];
    }

    exec(cli: typeof CLI) {
        const helpArg = cli.nonFlagArgs.join(' ');
        if (helpArg == 'simple') {
            // Help.displaySimpleHelp();
            Printer.print(getSimpleFlagHelp(cli.flags));
            return;
        }

        if (helpArg == 'all') {
            cli.flags.forEach((f) => {
                Printer.print([null, null]);
                f.printHelp();
                Printer.print([null, null]);
            });
            return;
        }

        const flag = cli.flags.find((f) => f.helpAliases.includes(helpArg));
        if (!flag) {
            Printer.printWarningBlock(
                ['Try searching with broader search terms or using a specific flag name.'],
                'Flag Not Found'
            );
        } else {
            Printer.print([null, null]);
            flag.printHelp();
        }
    }
}

function getSimpleFlagHelp(flags: CLIFlag[]) {
    const flagsDescription: Log[] = [
        null,
        ['h1', ['Simple Flag Usage']],
        [
            'p',
            'These are flags that can only be used by themselves without arguments. ' +
                'If an attempt is made to use them with other flags or arguments, an error ' +
                'will occur.',
        ],
    ];
    const flagSyntax: Log[] = [null, ['h2', ['Syntax']]];
    const flagDetails: Log[] = [null, ['h2', ['Details']]];
    for (const flag of flags) {
        if (flag.type == 'simple') {
            const [shortName, longName] = flag.name;
            const syntax = `;x;[ ;c;-${fitStringEnd(shortName, 3)} | -${fitStringEnd(
                longName,
                15
            )} ;x;]`;
            if (flagSyntax.length == 2) {
                flagSyntax.push(['p', `;by;wak ${syntax}`]);
            } else {
                flagSyntax.push(['p', `${syntax}`, 4]);
            }

            flagDetails.push(
                ['cd', [`${shortName}`, flag.shortHelpDisplay], 3 - shortName.length],
                null
            );
        }
    }
    return [...flagsDescription, ...flagSyntax, ...flagDetails];
}
