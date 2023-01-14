# Read Me

This is a TypeScript project for NodeJS, with sane defaults for code style and linting. Just clone and go!

There are a few defaults that should be changed however, like package `name`, `cmd-name`, and `author`. You can find those in the [package.json](/package.json). Depending on your project, you may also want to change the `license` property as well. By default, this project is [MIT](/LICENSE) licensed.

## Commit Syntax

You may or may not like the syntax guidelines outlined in the [Commit Syntax](/docs/commit_syntax.md) Doc file. These guidelines are specific to my own projects, but you're free to adopt whatever you deem appropriate for your own project.

## Code Style Guidelines

ESLint takes care of 99% of the code style requirements, but there are some things that I enforce for my own projects. The [code_style](/docs/code_style.md)is a supplement to existing ESLint defaults. Feel free to ignore or adopt at your leisure.

## Opinionated Folder Structure

Too much flexibility can be a bad thing, so I've created a pre-defined folder structure that I think works very well for most projects:

- **/** _ROOT DIR_ should contain all configuration files
- **/src** should contain [lib](/src/lib) directory and [main.ts](/src/main.ts) entry point
- **/src/lib** should contain all source code that contributes to `main.ts` entry point
- **/bin** should contain all compiled source and assets - _the dist directory_

## Default Logger

A lot of my side projects use some variation of a simple logger, so I thought I would roll my own **very** low-profile [Logger](/src/lib/logger.ts) with sane defaults. It is also easily extendable. It has `0` dependencies and should meet most basic text-based console logging needs.

## Get Started

### Install

`npm i`

**Important!!**

After installation, make sure you create or execute a TypeScript build task using the root [tsconfig](/tsconfig.json) file. The `./bin` directory needs to be populated before any of the following commands will work.

VSCODE users can simply execute the `Run Build Task` command (or by using the corresponding keyboard shortcut) and it should automatically popup with an option to build or watch the `tsconfig` file. The default keybinding is `Ctrl+Shift+B`.

### Run in dev mode

`npm run dev`

### Test typescript source map support

`npm run dev throw`

### Run in production mode

`node . <args>`

### Install Globally

`npm -g i .`

### Run using global command

`cmd-name <args>`
