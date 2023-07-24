import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import * as rss from '../../rss.js';
import { Log, Printer } from '../../printer/printer.js';

export class RSSFeedFlag extends CLIFlag {
    name: CLIFlagName = ['rss', 'rss-feed'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'rss',
        'feed',
        'get rss',
        'find rss',
        'search rss',
        'lookup rss',
    ];

    getHelpLogs(): Log[] {
        return [
            ['h1', ['RSS Feed']],
            [
                'p',
                'Searches ;x;nyaa.si ;bk;using your provided search terms. This results ' +
                    'in the number of torrents found, file-name of the latest torrent and ' +
                    'an RSS feed link.',
            ],
            null,
            [
                'p',
                ';m;NOTE: ;bk;This allows you to quickly set up RSS for your torrents to be ' +
                    'downloaded automatically. The number of entries should clue you in on ' +
                    'whether or not you need to refine your search.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', ['rss', 'rss-feed'], '<name>'],
            null,
            ['h2', ['Details']],
            ['d', ['name', 'The exact name or partial name of any anime.']],
            null,
            ['h2', ['Examples']],
            ['e', ['rss', 'subsplease bou no hero 1080p']],
            ['e', ['rss-feed', 'asw berserk 720p']],
        ];
    }

    async exec(cli: typeof CLI) {
        Printer.print([null]);
        const stopLoader = Printer.printLoader('RSS Lookup');
        const [error, result] = await rss.getFansubRSS(cli.nonFlagArgs.join(' '));
        stopLoader();
        Printer.print([['h3', ['RSS Lookup']]]);

        if (error && !result) {
            Printer.printError(
                [`;bc;${error.parseError}`, '', `Failed to parse: ;x;${error.fileName}`],
                'Unsupported',
                3
            );
            return;
        }

        if (!error && !result) {
            Printer.printInfo('Anime Not Found', undefined, 3);
            return;
        }

        Printer.print([
            null,
            ['h2', ['Details']],
            ['py', ['Query', `;g;${cli.nonFlagArgs.join(' ')}`], 2],
            ['py', ['Entries', `${result.entryCount}`]],
            ['', `;c;RSS: ;x;${result.rss}`, 7],
            null,
            ['h2', ['Latest Entry']],
            ['py', ['Title', `${result.title}`], 2],
            ['py', ['FanSub', `${result.fansub}`], 1],
            ['py', ['Episode', `${result.episode}`]],
            ['py', ['Season', `${result.season ?? ';m;unspecified'}`], 1],
            ['py', ['BitRate', `${result.bitrate ?? ';m;unknown'}`]],
            null,
        ]);
    }
}
