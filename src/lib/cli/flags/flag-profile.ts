import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';

const { h1, nl } = Help.display;

export class ProfileFlag implements CLIFlag {
    name: CLIFlagName = ['p', 'profile'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'display profile',
        'show profile',
        'get profile',
        'lookup profile',
    ];

    shortHelpDisplay = 'Displays the currently logged in Kitsu profile.';

    helpDisplay: string[] = [
        h1(`Display Profile`),
        nl(`This flag allows you to display your currently logged`),
        nl(`in user profile. The displays your Username, About,`),
        nl(`Profile Link, Watch Time, and Completed Series count.`),
        '',
    ];

    exec = Kitsu.displayUserProfile;
}
