import { CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Config } from '../../config.js';
import { Log, Printer } from '../../printer/printer.js';

export class ColorFlag extends CLIFlag {
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

    getHelpLogs(): Log[] {
        return [
            ['h1', ['Toggle Console Color']],
            ['p', 'Turns ;g;On ;bk;or ;r;Off ;bk;the console colors.'],
            null,
            [
                'p',
                'If the color is currently ;g;On;bk;, then executing the command will turn ' +
                    ';r;Off ;bk;the color. Likewise, if the color is currently ;r;Off;bk;, ' +
                    'executing the command will turn ;g;On ;bk;the color.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] | null {
        return [
            ['h2', ['Usage']],
            ['s', ['c', 'color'], ''],
            null,
            ['h2', ['Examples']],
            ['e', ['c', '']],
            ['e', ['color', '']],
        ];
    }

    exec() {
        const colorState = Config.get('useColor');
        Config.set('useColor', !colorState);
        Printer.print([null, ['py', ['Color', `${!colorState ? ';bg;On' : 'Off'}`]], null]);
        Config.save();
    }
}
