import { stdout } from 'process';

const _dotFrames = ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'];

const _hideCursorChar = '\u001B[?25l';
const _showCursorChar = '\u001B[?25h';

export function createSpinner(text: string) {
    let interval: NodeJS.Timeout;

    function start(fps: number) {
        if (!text.includes('@@')) {
            throw Error('missing "@@" placeholder');
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
    if (framePos > 0) clearStdout();
    if (framePos == _dotFrames.length) framePos = 0;
    const str = msg.replaceAll('@@', _dotFrames[framePos]);
    stdout.write(`${str}${_hideCursorChar}\n`);
    return ++framePos;
}

function clearStdout() {
    stdout.moveCursor(0, -1);
    stdout.clearLine(0);
    stdout.cursorTo(0);
}
