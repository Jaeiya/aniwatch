import { Help } from '../../help.js';
import { Log } from '../../printer/printer.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

const { h1, nl } = Help.display;

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

    helpDisplay: string[] = [
        h1(`Test Command`),
        nl(`Do ;m;not ;x;execute this command unless you know what it does.`),
        '',
    ];

    exec() {
        //
    }
}
