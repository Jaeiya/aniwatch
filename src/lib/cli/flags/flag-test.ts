import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

const { h1, nl } = Help.display;

export class TestFlag implements CLIFlag {
    name: CLIFlagName = ['!', '!'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [...this.name];

    shortHelpDisplay = `It could literally do anything...?`;

    helpDisplay: string[] = [
        h1(`Test Command`),
        nl(`Do ;m;not ;x;execute this command unless you know what it does.`),
        '',
    ];

    exec() {
        //
    }
}
