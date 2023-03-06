#!/usr/bin/env node
import './init.js';
import { CLI } from './lib/cli/cli.js';
import { Flags } from './lib/cli/flags/flags.js';

for (const Flag of Flags) {
    CLI.addFlag(new Flag());
}

await CLI.tryExecFlags();
