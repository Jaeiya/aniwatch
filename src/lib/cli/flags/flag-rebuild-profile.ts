import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Kitsu } from '../../kitsu/kitsu.js';
import { Log } from '../../printer/printer.js';

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

    exec = Kitsu.rebuildProfile;
}
