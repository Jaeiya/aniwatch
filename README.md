# About

Wakitsu is a CLI application designed to find an anime episode on disk, at the working directory, filtered by SubsPlease Fansub group. If found, it will update your [Kitsu] watch list and move the file to a "watched" folder.

> This is a Hobby project created out of a need for both relaxation and organization.

I don't know how many people out there have this specific use-case, but I was really bad at manually updating my progress on [Kitsu], so I figured if I could make it dead simple through command line, I'd actually keep up with it. As it turns out, I haven't missed a single progress update since.

If you're like me and find the CLI a lot more user-friendly than going to a website, then this program might be for you!

## Getting Started

### Easy Global Install

```bash
npm i -g wakitsu
```

Once it's installed, you can open a command prompt and begin using the program by typing `wak -h`. It should walk you through a few prompts to get your data from [Kitsu] and then immediately display a help screen on how to use the application.

## Development Installation

Clone this repository and then run the following command in the directory where you cloned it.

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

`wak <args>`

## Need Help?

There is built-in help in the form of a help flag. This will give you a full detailed rundown of how to use every feature of the program. The command below will render like an error, but that's only because there is no logic for a flag that can be used **with** and **without** an argument.

`wak -h` or `wak --help`

[kitsu]: https://kitsu.io
