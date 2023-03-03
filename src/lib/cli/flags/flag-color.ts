import { Help } from '../../help.js';
import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Config } from '../../config.js';

const { h1, nl } = Help.display;

export class ColorFlag implements CLIFlag {
    name: CLIFlagName = ['cl', 'color'];
    type: CLIFlagType = 'simple';

    helpAliases: string[] = [
        ...this.name,
        'display profile',
        'show profile',
        'get profile',
        'lookup profile',
    ];

    shortHelpDisplay = 'Toggle the console colors ;bg;On ;x;or ;r;Off;bk;.';

    helpDisplay: string[] = [
        h1(`Toggle Console Color`),
        nl(`Turns ;bg;On ;bk;or ;r;Off ;bk;the console colors. `),
        ' ',
        nl(`If the color is currently ;bg;On ;bk;then executing the`),
        nl(`command will turn ;r;Off ;bk;the color.`),
        ' ',
        nl(`Likewise, if the color is currently ;r;Off;bk;, `),
        nl(`executing the command will turn ;bg;On ;bk;the color.`),
        '',
    ];

    exec = () => {
        const colorState = Config.get('useColor');
        Config.set('useColor', (_con.showColor = !colorState));
        _con.chainInfo(['', `;bc;Color: ;by;${!colorState ? 'On' : 'Off'}`]);
        Config.save();
    };
}
