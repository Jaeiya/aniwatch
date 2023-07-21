import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log, Printer } from '../../printer/printer.js';

export class RebuildProfileFlag extends CLIFlag {
    name: CLIFlagName = ['rp', 'rebuild-profile'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [...this.name, 'rebuild profile', 'reload profile', 'load profile'];

    shortHelpDisplay = 'Rebuilds your profile data from Kitsu.';

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Rebuild Profile']],
            [
                'p',
                'Rebuilds your profile data from Kitsu. This is useful if you want up-to-date ' +
                    `watch time info after you've watched an episode.`,
            ],
            null,
        ];
    }

    async exec(): Promise<void> {
        Printer.print([null]);
        const stopLoader = Printer.printLoader('Rebuilding Profile');
        const hasRebuilt = await Kitsu.rebuildProfile();
        stopLoader();
        Printer.print([['h3', ['Rebuilding Profile']]]);
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
}
