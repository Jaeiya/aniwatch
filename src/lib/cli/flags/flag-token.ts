import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { getTimeUnits } from '../../utils.js';
import { Log } from '../../printer/printer.js';

const { nl } = Help.display;

export class TokenFlag extends CLIFlag {
    name: CLIFlagName = ['t', 'token'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'display token',
        'show token',
        'token info',
        'lookup token',
        'refresh token',
        'access token',
        'auth token',
        'authorization token',
    ];

    shortHelpDisplay = 'Displays info about your access Token.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Control and Displays Token']],
            [
                'p',
                'Your access token is what allows you to connect to the Kitsu API and ' +
                    'update your watch list. This command lets you know the expiration of ' +
                    'that token and how to ;x;refresh ;bk;or ;x;reset ;bk;it.',
            ],
            null,
            ['p', ';m;Resetting: ;bk;This is only necessary if your token ;x;expires;bk;.'],
            null,
            [
                'p',
                ';m;Refreshing: ;bk;This is only necessary when your token is ;x;about ' +
                    ';bk;to ;x;expire;bk;.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Syntax']],
            ['s', [['t', 'token'], '<info|reset|refresh>']],
            null,
            ['h2', ['Details']],
            ['d', ['info', 'Displays your tokens and their expiration'], 3],
            null,
            [
                'd',
                [
                    'reset',
                    'Prompts you to log in again with your password to grant ' +
                        'a brand new access token.',
                ],
                2,
            ],
            null,
            [
                'd',
                ['refresh', 'Refreshes your access token, which resets its expiration date.'],
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['t', 'info']],
            ['e', ['token', 'info']],
            ['e', ['t', 'reset']],
            ['e', ['token', 'reset']],
            ['e', ['t', 'refresh']],
            ['e', ['token', 'refresh']],
        ];
    }

    readonly longTokenDesc = [
        nl(`Your access token grants you access to the Kitsu `),
        nl(`API, so if it expires, you no longer have access.`),
        ' ',
        nl(`Shown below, is an expiration timer that goes from`),
        nl(`;bg;Green ;bk;to ;by;Yellow ;bk;to ;br;Red;bk;. The closer you get to Red,`),
        nl(`the closer the token is to expiring. You should`),
        nl(`refresh the token ;x;as soon as ;bk;it turns Red.`),
        '',
    ];

    exec: (cli: typeof CLI) => void | Promise<void> = async (cli) => {
        const [arg] = cli.nonFlagArgs;

        if (arg == 'info') {
            return showTokenInfo('Token Info', this.longTokenDesc);
        }

        if (arg == 'refresh') {
            await Kitsu.refreshToken();
            return showTokenInfo('Refreshed Token Info');
        }

        if (arg == 'reset') {
            await Kitsu.resetToken();
            return showTokenInfo('Reset Token Info');
        }
    };
}

function showTokenInfo(title: string, description: string[] = []) {
    const tokenInfo = Kitsu.tokenInfo;
    _con.chainInfo([
        '',
        `;by;${title}`,
        ...description,
        nl(`;bc; Access Token: ;bk;${tokenInfo.accessToken}`),
        nl(`;bc;Refresh Token: ;bk;${tokenInfo.refreshToken}`),
        nl(`;bc;   Expires In: ${getTokenExpirationStr(tokenInfo.expiresSec)}`),
    ]);
}

function getTokenExpirationStr(secondsUntilExpired: number) {
    const daysToExpiration = Math.floor(
        getTimeUnits(secondsUntilExpired - Date.now() / 1000).days
    );
    return daysToExpiration >= 14
        ? `;bg;${daysToExpiration} Days`
        : daysToExpiration >= 7
        ? `;by;${daysToExpiration} Days`
        : daysToExpiration > 0
        ? `;br;${daysToExpiration} Days`
        : ';br;EXPIRED ;by;(You need to ;br;RESET ;by;the token)';
}
