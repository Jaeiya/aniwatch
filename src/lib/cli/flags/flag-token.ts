import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { getTimeUnits } from '../../utils.js';

const { h1, h2, i3, i4, nl } = Help.display;

export class TokenFlag implements CLIFlag {
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
    helpSyntax: string[] = [
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-t ;x;| ;bc;--token;x;] ;y;<info|reset|refresh>`),
        '',
        h2(`Details`),
        nl(`   ;y;info  ;x;Displays your tokens and their expiration.`),
        '',
        nl(`  ;y;reset  ;x;Prompts you to log in again with your password`),
        i3(`   ;x;to grant a brand new access token.`),
        '',
        nl(`;y;refresh  ;x;Refreshes your access token, which resets`),
        i3(`   ;x;its expiration date.`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-t ;y;info`),
        nl(`;by;wak ;bc;--token ;y;info`),
        nl(`;by;wak ;bc;-t ;y;reset`),
        nl(`;by;wak ;bc;--token ;y;reset`),
        nl(`;by;wak ;bc;-t ;y;refresh`),
        nl(`;by;wak ;bc;--token ;y;refresh`),
    ];

    helpDisplay: string[] = [
        h1(`Control and Display Token`),
        nl(`Your access token is what allows you to connect to`),
        nl(`the Kitsu API and update your watch list. This command lets`),
        nl(`you know the expiration of that token and how to ;x;refresh`),
        nl(`;bk;or ;x;reset ;bk;it.`),
        ' ',
        nl(`;m;Resetting: ;bk;This is only necessary if your token ;x;expires;bk;.`),
        '',
        nl(`;m;Refreshing: ;bk;This is only necessary when your token is`),
        i4(`   ;x;about ;bk;to ;x;expire;bk;.`),
        '',
        ...this.helpSyntax,
    ];

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
        nl(`;bc;   Expires In: ${getTokenExpirationStr(tokenInfo.expires)}`),
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
