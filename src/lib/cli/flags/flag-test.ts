import { Log } from '../../printer/printer.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

export class TestFlag extends CLIFlag {
    name: CLIFlagName = ['!', '!'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [...this.name];

    shortHelpDisplay = `It could literally do anything...?`;

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Test Command']],
            ['p', 'Do ;m;NOT ;bk;execute this command unless you know what it does.'],
        ];
    }

    exec() {
        //
    }
}
