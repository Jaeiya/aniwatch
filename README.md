# Read Me

Aniwatch is a CLI application designed to find a user-specified anime episode, at the working directory, filtered by SubsPlease Fansub group. If found, it will update your Kitsu watch list and move the file to a "watched" folder.

## Getting Started

### Install

Clone this repository and then run the following command in the directory where you cloned it. _I will not be publishing this to NPM._

`npm i`

**Important!!**

After installation, make sure you create or execute a TypeScript build task using the root [tsconfig](/tsconfig.json) file. This is because the `./bin` directory needs to be populated before any of the following commands will work.

VSCODE users can simply execute the `Run Build Task` command (or by using the corresponding keyboard shortcut) and it should automatically popup with an option to build or watch the `tsconfig` file. The default keybinding is `Ctrl+Shift+B`.

### Run in dev mode

`npm run dev`

### Run in production mode

`node . <args>`

### Install Globally

`npm -g i .`

### Run using global command

`aniwatch <args>`

## Need Help?

There is built-in help in the form of a help flag. This will give you a full detailed rundown of how to use every feature of the program. The command below will render like an error, but that's only because there is no logic for a flag that can be used **with** and **without** an argument.

`aniwatch -h` or `aniwatch --help`
