import { stdout } from 'process';

const _dotFrames = ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'];

const _hideCursorChar = '\u001B[?25l';
const _showCursorChar = '\u001B[?25h';

export function createSpinner(text: string) {
    let interval: NodeJS.Timer;

    function start(fps: number) {
        if (!text.includes('@spin')) {
            throw Error('missing "@spin" placeholder');
        }
        let framePos = 0;
        writeSpinnerFrame(framePos++, text);
        interval = setInterval(() => {
            framePos = writeSpinnerFrame(framePos++, text);
        }, Math.ceil(1000 / fps));
    }

    return {
        start,
        stop: () => {
            clearInterval(interval);
            clearStdout();
            stdout.write(_showCursorChar);
        },
    };
}

/**
 * Writes a single frame of the dot array to console
 * and returns the next frame position.
 */
function writeSpinnerFrame(framePos: number, msg: string) {
    clearStdout();
    if (framePos == _dotFrames.length) framePos = 0;
    const str = msg.replaceAll('@spin', _dotFrames[framePos]);
    stdout.write(`${str}${_hideCursorChar}`);
    return ++framePos;
}

function clearStdout() {
    stdout.clearLine(0);
    stdout.cursorTo(0);
}
