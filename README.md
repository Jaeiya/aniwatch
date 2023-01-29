# Read Me

Aniwatch is designed to find a single anime episode on your hard drive from SubsPlease and move it to a watched folder. I'm too lazy to do this manually, so I wrote this very simple script.

## Getting Started

### Install

Clone this repository and then run the following command in the directory where you cloned it. _I will not be publishing this to NPM._

`npm i`

**Important!!**

After installation, make sure you create or execute a TypeScript build task using the root [tsconfig](/tsconfig.json) file. The `./bin` directory needs to be populated before any of the following commands will work.

VSCODE users can simply execute the `Run Build Task` command (or by using the corresponding keyboard shortcut) and it should automatically popup with an option to build or watch the `tsconfig` file. The default keybinding is `Ctrl+Shift+B`.

### Run in dev mode

`npm run dev`

### Run in production mode

`node . <args>`

### Install Globally

`npm -g i .`

### Run using global command

`aniwatch <args>`
