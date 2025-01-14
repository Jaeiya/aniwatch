import { CLI, CLIFlag, CLIFlagName, CLIFlagType } from '../cli.js';
import { Log, Printer } from '../../printer/printer.js';
import {
    displayWatchError,
    displayWatchProgress,
    useAnimeAutoWatcher,
    useAnimeWatcher,
} from '../../watch.js';

export class DefaultFlag extends CLIFlag {
    name: CLIFlagName = ['m', 'manual'];
    type: CLIFlagType = 'multiArg';
    isDefault = true;

    helpAliases: string[] = [
        ...this.name,
        'default',
        'default usage',
        'how do I watch anime',
        'watch',
        'normal',
        'normal usage',
        'basic',
        'usage',
        'basic usage',
        'how to use',
        'how to use program',
        'how do I use program',
        'how do I watch anime',
        'how do I update kitsu',
    ];

    getHelpLogs(): Log[] {
        return [
            ['h1', ['How to progress your Anime']],
            [
                'p',
                'Scans the current working directory for the specified anime ;y;name ;bk;and ' +
                    ';y;ep;bk;isode number, then updates your progress on Kitsu for that anime ' +
                    'at the ;y;ep;bk;isode number you specified.',
            ],
            null,
            [
                'p',
                'If the anime file on disk is using a different numbering schema than ' +
                    'Kitsu, then you can use the ;y;f;bk;orced ;y;ep;bk;isode number: ' +
                    ';y;fep;bk;, to set episode progress manually.  This will force Kitsu ' +
                    'to update your progress to ;y;fep;bk;.',
            ],
            null,
            [
                'p',
                ';m;Manual Mode: ;bk;By default, this command executes without the need to ' +
                    'pass any flag to the program. If you pass the ;c;-m ;bk;or ;c;-manual ' +
                    ';bk;flags, then it activates manual mode, which will allow you to update ' +
                    'your anime using two different methods: ;bw;upd ;bk;and ;bw;raw;bk;.' +
                    ' You can read about them below.',
            ],
            null,
            [
                'p',
                ';m;Auto-Progress: ;bk;If you enter only the ;y;name ;bk;of an anime, then ' +
                    'you will be prompted to auto-update its progress; ;x;only ;bk;if the file ' +
                    'can be found on disk. In order for this mechanism to work, you must have ' +
                    ';x;already ;bk;watched the ;x;first ;bk;episode of the anime, otherwise ' +
                    'an error will be displayed, telling you to update with an ;y;ep;bk;isode ' +
                    'number, which you can do by following the ;x;usage ;bk;info below.',
            ],
            null,
        ];
    }

    getSyntaxHelpLogs(): Log[] {
        return [
            ['h2', ['Usage']],
            [
                's',
                null,
                ';y;<name> <ep> <?fep> ;m;or ;by;wak ;x;[;c;-m ;x;| ;c;-manual;x;] ;y;<upd|raw> ',
            ],
            null,
            ['h2', ['Details']],
            null,
            ['d', ['name', 'Full or partial name of an existing anime on disk.']],
            null,
            ['d', ['ep', 'Episode number of anime ;y;<name> ;x;on disk.'], 2],
            null,
            [
                'd',
                [
                    'fep',
                    ';m;(optional) ;x;Update Kitsu progress with ;y;<fep> ;x;instead of ;y;<ep>;bk;.',
                ],
                1,
            ],
            null,
            ['h2', ['Manual Details']],
            null,
            ['d', ['upd', 'Updates an anime directly without the need for a fansub file.'], 1],
            null,
            [
                'd',
                [
                    'raw',
                    'Allows you to bind a file to a specified anime and update its progress.',
                ],
                1,
            ],
            null,
            ['h2', ['Examples']],
            ['e', ['', `"boku no hero" 10 ;b;(Sets Boku no Hero progress: ;x;10;b;)`]],
            ['e', ['', 'berserk 3         ;b;(Sets Berserk progress: ;x;3;b;)']],
            ['e', ['', 'jujutsu 25 1      ;b;(Sets Jujutsu S02 progress: ;x;1;b;)']],
            ['e', ['', 'bleach            ;b;(Sets Bleach: ;x;progress + 1;b;)']],
            ['e', ['m', 'upd            ;b;(Enters Manual ;x;Update Mode;b;)']],
            ['e', ['m', 'raw            ;b;(Enters Manual ;x;Raw Mode;b;)']],
        ];
    }

    exec(): Promise<void> | void {
        const args = CLI.nonFlagArgs;

        if (!CLI.userArgs.length) {
            const helpFlag = CLI.flags.find((f) => f.name.includes('help'));
            if (helpFlag) {
                Printer.print([null, null]);
                helpFlag.printHelp();
            }
            return;
        }

        const isManual = !!CLI.flagArgs.find((f) => this.name.includes(f.substring(1)));

        if (!isManual) {
            return execAutoWatch();
        }

        const hasValidArgs = CLI.validateSingleArg({
            args: ['upd', 'raw'],
            flag: this,
        });

        if (!hasValidArgs) {
            Printer.printError(
                'Read the help below to learn the correct syntax:',
                'Invalid Syntax'
            );
            return this.printHelp();
        }

        const [arg] = CLI.nonFlagArgs;

        if (arg == 'upd') {
            return execWatch();
        }

        if (arg == 'raw') {
            return execWatch(true);
        }
    }
}

async function execWatch(isDiscovering = false) {
    const titleText = isDiscovering ? 'file name' : 'anime title';
    const userResp = await Printer.prompt(
        `Enter ${titleText} (can be partial) and episode number, separated by a | (pipe) ` +
            'symbol, with an optional forced episode number. ' +
            'Example: ;y;bleach;bg;|;y;1;bg;|;y;13'
    );

    if (userResp.trim() == '') {
        return Printer.printWarning('Operation cancelled manually', 'Aborted', 3);
    }

    if (!userResp.includes('|')) {
        return Printer.printError(
            'Make sure you separate values with a | (pipe)',
            'Invalid Input',
            3
        );
    }

    const [title, ep, forcedEp] = userResp.split('|');

    const epNum = Number(ep);
    const forcedEpNum = Number(forcedEp);

    if (title.length < 4) {
        return Printer.printWarning(
            'Use a title with at least 4 characters to prevent collisions.'
        );
    }

    if (isNaN(epNum)) {
        return Printer.printError(`";c;${ep};y;" is not a valid ;by;episode ;y;number`);
    }

    if (forcedEp && isNaN(forcedEpNum)) {
        return Printer.printError(
            `";c;${forcedEp};y;" is not a valid ;by;forced episode ;y;number`
        );
    }

    const [watchError, watcher] = await useAnimeWatcher({
        titleOrCache: title,
        episode: [epNum, forcedEp ? forcedEpNum : 0],
        isDiscovering,
    });

    const stopLoader = Printer.printLoader('Setting Progress');

    if (watchError) {
        stopLoader();
        return displayWatchError(watchError, title);
    }

    // Check --manual flag presence
    if (CLI.flagArgs.length == 0 || isDiscovering) {
        const [fileError, mover] = watcher.useFansubMover();
        if (fileError) {
            stopLoader();
            return displayWatchError(fileError, title);
        }
        mover.move();
    }

    const { anime, completed, tokenExpiresIn } = await watcher.setProgress();
    stopLoader();
    displayWatchProgress({ anime, completed, tokenExpiresIn });
}

async function execAutoWatch() {
    Printer.print([null, ['h3', ['Auto Progressing Anime']]]);

    const [title] = CLI.nonFlagArgs;

    const [watchError, autoWatcher] = await useAnimeAutoWatcher({
        titleOrCache: title,
    });

    if (watchError) {
        return displayWatchError(watchError, title);
    }

    const { anime, fileData, setProgress, newProgress, moveFansubFile } = autoWatcher;

    Printer.print([
        null,
        ['py', ['JP Title', anime.jpTitle]],
        ['py', ['EN Title', anime.enTitle ?? '']],
        ['py', ['File', `;y;${fileData.title} ;by;${fileData.paddedEpNum}`], 4],
        null,
        ['p', `;b;Progress will be set from ;bg;${anime.epProgress} ;b;to ;by;${newProgress}`],
    ]);

    const hasConsent = await Printer.promptYesNo(
        'Do you want to proceed with the changes above'
    );

    if (!hasConsent) {
        return Printer.printWarning(
            'User cancelled the operation manually.',
            'Operation Aborted',
            3
        );
    }

    const stopLoader = Printer.printLoader('Setting Progress', 2);
    moveFansubFile();
    const { completed, anime: newAnimeObj, tokenExpiresIn } = await setProgress();
    stopLoader();
    displayWatchProgress({
        anime: newAnimeObj,
        autoIncrement: true,
        completed,
        tokenExpiresIn,
    });
}
