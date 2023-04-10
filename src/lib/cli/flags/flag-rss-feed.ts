import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import * as rss from '../../rss.js';
import { truncateStr } from '../../utils.js';

const { h1, h2, nl } = Help.display;

export class RSSFeedFlag implements CLIFlag {
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

    helpSyntax: string[] = [
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-rss ;x;| ;bc;--rss-feed;x;] ;y;<name>`),
        '',
        h2(`Details`),
        nl(`;y;name    ;x;The exact name or partial name of any anime.`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-rss ;y;"subsplease boku no hero 1080p"`),
        nl(`;by;wak ;bc;--rss-feed ;y;asw berserk 720p`),
    ];

    helpDisplay: string[] = [
        h1(`RSS Feed`),
        nl(`Searches ;x;nyaa.si;bk; using your provided search terms`),
        nl(`This results in the number of torrents found,`),
        nl(`file-name of latest torrent and an RSS Feed link.`),
        '',
        nl(`;m;NOTE: ;bk;This allows you to quickly set up RSS for your`),
        nl(`torrents to be downloaded automatically. The number`),
        nl(`of entries should clue you in on whether or not you`),
        nl(`need to refine your search.`),
        '',
        ...this.helpSyntax,
    ];

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
