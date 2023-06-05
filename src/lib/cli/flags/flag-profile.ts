import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log } from '../../printer/printer.js';

export class ProfileFlag extends CLIFlag {
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

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Display Profile']],
            [
                'p',
                'This flag allows you to display your currently logged in user profile. ' +
                    'It displays your Username, About, Profile Link, Watch Time, and ' +
                    'Completed Series count.',
            ],
            null,
        ];
    }

    exec = Kitsu.displayUserProfile;
}
