import { Help } from '../../help.js';
import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Logger } from '../../logger.js';

const { h1, h2, f, arg, x, d, ex } = Help.colors;
const { nl, ind2 } = Help.textFlowUtils;

export class HelpFlag implements CLIFlag {
  name: CLIFlagName = ['h', 'help'];
  type: CLIFlagType = 'multiArg';

  helpAliases: string[] = [...this.name, 'need help', 'how to use help'];

  helpDisplay: string[] = [
    `${h1}Help`,
    `${nl}Allows you to discover all functionality about`,
    `${nl}this application.`,
    '',
    `${h2}Syntax:`,
    `${nl}${ex}wak ${x}[${f}-h ${x}| ${f}--help${x}] ${arg}<all|simple|flag|desc>`,
    '',
    `${h2}Details:`,
    `${nl}${arg}all${x}    Displays all available help entries (Huge List).`,
    '',
    `${nl}${arg}simple${x} Displays help for all basic commands.`,
    '',
    `${nl}${arg}flag${x}   The name of an existing flag that you want more`,
    `${ind2}    help with.`,
    '',
    `${nl}${arg}desc${x}   Description of the action you want help for.`,
    '',
    `${h2}Examples:`,
    `${nl}${ex}wak ${f}-h ${arg}all           ${d}(Displays all default help)`,
    `${nl}${ex}wak ${f}-h ${arg}f             ${d}(Displays --find-anime help)`,
    `${nl}${ex}wak ${f}-h ${arg}c             ${d}(Displays --cache help)`,
    `${nl}${ex}wak ${f}-h ${arg}basic usage   ${d}(Displays how to watch anime)`,
    `${nl}${ex}wak ${f}-h ${arg}show profile  ${d}(Displays --profile help)`,
    `${nl}${ex}wak ${f}-h ${arg}reload cache  ${d}(Displays --rebuild-cache help)`,
    '',
    `${h2}Broad Explanation:`,
    `${nl}When using the ${arg}desc ${d}argument, think of the event`,
    `${nl}you're trying to get help with. If you want to know how`,
    `${nl}to lookup an existing anime, you could type something`,
    `${nl}like ${h1}search anime ${d}or ${h1}lookup anime ${d}as a ${arg}desc ${d}argument.`,
    '',
    `${nl}There's still a possibility that you type in an unknown`,
    `${nl}description, but if you think about it long enough, you`,
    `${nl}should be able to figure out a known description for`,
    `${nl}the functionality you're looking for.`,
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
      Logger.error(`Could not find help using: ${ex}${helpArg}`);
      return;
    }
    Help.displayHelp(helpStrings);
  }
}
