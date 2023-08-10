import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log, Printer } from '../../printer/printer.js';

export class ProfileFlag extends CLIFlag {
    name: CLIFlagName = ['p', 'profile'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [
        ...this.name,
        'display profile',
        'show profile',
        'get profile',
        'lookup profile',
        'rebuild profile',
        'reload profile',
        'load profile',
    ];

    shortHelpDisplay = 'Displays the currently logged in Kitsu profile.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Profile']],
            [
                'p',
                'Displays the currently cached profile or rebuilds the profile from Kitsu. ' +
                    `It's a good idea to ;x;re-build the profile periodically;bk;, because ` +
                    'its info can quickly become old as you watch more and more anime.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] | null {
        return [
            ['h2', ['Usage']],
            ['s', ['p', 'profile'], '<info|rebuild>'],
            null,
            ['h2', ['Details']],
            ['d', ['info', 'Display your cached Kitsu profile data.'], 3],
            null,
            ['d', ['rebuild', 'Re-build your cached profile from Kitsu.']],
            null,
            ['h2', ['Examples']],
            ['e', ['p', 'info']],
            ['e', ['p', 'rebuild']],
            ['e', ['profile', 'info']],
            ['e', ['profile', 'rebuild']],
        ];
    }

    exec() {
        const [arg] = CLI.nonFlagArgs;
        const hasValidArgs = CLI.validateSingleArg({
            args: ['info', 'rebuild'],
            flag: this,
        });

        if (hasValidArgs) {
            if (arg == 'info') {
                return Kitsu.displayUserProfile();
            }

            if (arg == 'rebuild') {
                return rebuildProfile();
            }
        }
    }
}

async function rebuildProfile() {
    const stopLoader = Printer.printLoader('Rebuilding Profile');
    const hasRebuilt = await Kitsu.rebuildProfile();
    stopLoader();

    if (!hasRebuilt) {
        return Printer.printError(
            [
                'Your profile could not be found',
                '',
                ';bc;... ;y;Possible Issues ;bc;...',
                '(;bc;1;y;) ;c;You changed your account name.',
                '(;bc;2;y;) ;c;Your account is temporarily inaccessible.',
                '(;bc;3;y;) ;c;Your account has been deleted.',
                '(;bc;4;y;) ;c;Wakitsu configuration ;m;might ;c;be corrupted',
            ],
            undefined,
            3
        );
    }

    Printer.printInfo(
        'Your profile information has been refreshed using the live version',
        'Profile Rebuilt',
        3
    );
}
