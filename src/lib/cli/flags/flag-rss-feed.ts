import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import * as rss from '../../rss.js';
import { truncateStr } from '../../utils.js';
import { Log } from '../../printer/printer.js';

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
            ['s', [['rss', 'rss-feed'], '<name>']],
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
        _con.chainInfo(['', ';bm;... RSS Lookup ...']);
        const result = await rss.getFansubRSS(cli.nonFlagArgs.join(' '));
        _con.chainInfo([
            `;bc;Entries Found: ;g;${result.entryCount}`,
            `;bc;RSS: ;x;${result.rss}`,
            '',
            `;bm;... Latest Entry ...`,
            `;bc;  Title: ;y;${truncateStr(result.title, 60)}`,
            `;bc; FanSub: ;y;${result.fansub}`,
            `;bc;Episode: ;y;${result.episode}`,
            `;bc; Season: ;y;${result.season ?? ';m;unspecified'}`,
            `;bc;BitRate: ;y;${result.bitrate ?? ';m;unknown'}`,
        ]);
    }
}
