import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';

const { h1, em, d } = Help.colors;
const { nl } = Help.textFlowUtils;

export class RefreshTokenFlag implements CLIFlag {
    name: CLIFlagName = ['rt', 'refresh-token'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'refresh token',
        'get token',
        'renew token',
        'reload token',
        'token',
        'access token',
        'get access token',
    ];

    shortHelpDisplay = `Retrieves a new access token ${em}(rarely needed)${d}.`;

    helpDisplay: string[] = [
        `${h1}Refresh Access Token:`,
        `${nl}Refreshes your current access token. This will`,
        `${nl}only be ${em}necessary ${d}if your current token`,
        `${nl}expires.`,
        '',
        `${nl}Tokens tend to be valid for a long time, so this`,
        `${nl}isn't a flag you'll be using very often.`,
        '',
    ];

    exec = Kitsu.refreshToken;
}
