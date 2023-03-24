import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';

const { h1, h2, nl, i2 } = Help.display;

export class HelpFlag implements CLIFlag {
    name: CLIFlagName = ['h', 'help'];
    type: CLIFlagType = 'multiArg';

    helpAliases: string[] = [...this.name, 'need help', 'how to use help'];

    helpDisplay: string[] = [
        h1(`Help`),
        nl(`Allows you to discover all functionality about`),
        nl(`this application.`),
        '',
        h2(`Syntax`),
        nl(`;by;wak ;x;[;bc;-h ;x;| ;bc;--help;x;] ;y;<all|simple|flag|desc>`),
        '',
        h2(`Details`),
        nl(`;y;all    ;x;Displays all available help entries (Huge List).`),
        '',
        nl(`;y;simple ;x;Displays help for all basic commands.`),
        '',
        nl(`;y;flag   ;x;The name of an existing flag that you want more`),
        i2(`    help with.`),
        '',
        nl(`;y;desc   ;x;Description of the action you want help for.`),
        '',
        h2(`Examples`),
        nl(`;by;wak ;bc;-h ;y;all           ;bk;(Displays all default help)`),
        nl(`;by;wak ;bc;-h ;y;f             ;bk;(Displays --find-anime help)`),
        nl(`;by;wak ;bc;-h ;y;c             ;bk;(Displays --cache help)`),
        nl(`;by;wak ;bc;-h ;y;basic usage   ;bk;(Displays how to watch anime)`),
        nl(`;by;wak ;bc;-h ;y;show profile  ;bk;(Displays --profile help)`),
        nl(`;by;wak ;bc;-h ;y;reload cache  ;bk;(Displays --rebuild-cache help)`),
        '',
        h2(`Broad Explanation`),
        nl(`When using the ;y;desc ;bk;argument, think of the event`),
        nl(`you're trying to get help with. If you want to know how`),
        nl(`to lookup an existing anime, you could type something`),
        nl(`like ;x;search anime ;bk;or ;x;lookup anime ;bk;as a ;y;desc ;bk;argument.`),
        '',
        nl(`There's still a possibility that you type in an unknown`),
        nl(`description, but if you think about it long enough, you`),
        nl(`should be able to figure out a known description for`),
        nl(`the functionality you're looking for.`),
    ];

    exec(cli: typeof CLI) {
        const helpArg = cli.nonFlagArgs.join(' ');
        if (helpArg == 'simple') {
            Help.displaySimpleHelp();
            return;
        }

        if (helpArg == 'all') {
            Help.displayAllHelp();
            return;
        }

        const helpStrings = Help.findHelp(helpArg);
        if (!helpStrings) {
            _con.chainError(['', `Could not find help using: ;by;${helpArg}`]);
            return;
        }
        Help.displayHelp(['', '', ...helpStrings]);
    }
}
