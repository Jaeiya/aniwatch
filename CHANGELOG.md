# [5.0.0](https://github.com/jaeiya/wakitsu/compare/v4.1.0...v5.0.0) (4/4/2023)

### Breaking Changes ([5fcd844](https://github.com/Jaeiya/aniwatch/commit/5fcd844))

Unfortunately, yes, we're here again with some breaking changes, but there was absolutely no getting around it this time; title synonyms (alternative titles) could potentially be used as file names. Those titles are not always words or phrases within the official title, which means we had to add this property into Kitsu's cache, which always requires a deleting of the config file 🥺.

### Features

- **flags**: `--find-anime` now displays synonyms (alt titles) and partial synopsis ([c229256](https://github.com/Jaeiya/aniwatch/commit/c229256))
- **flags**: `--find-anime` supports finding an anime by its synonym (alt title) ([75bfa4a](https://github.com/Jaeiya/aniwatch/commit/75bfa4a))
- **watch**: support finding an anime file name by its synonym (alt title) ([5fcd844](https://github.com/Jaeiya/aniwatch/commit/5fcd844))

### Minor Changes

- **kitsu**: no longer store synopsis in cache ([206ff5c](https://github.com/Jaeiya/aniwatch/commit/206ff5c))

# [4.1.0](https://github.com/jaeiya/wakitsu/compare/v4.0.1...v4.1.0) (4/4/2023)

### Features

- **flags**: add `clean` flag to delete files in watched directory ([d08bc6e](https://github.com/Jaeiya/aniwatch/commit/d08bc6e))
- **watch**: remove "subsplease" file restrictions ([bab48ee](https://github.com/Jaeiya/aniwatch/commit/bab48ee))
- **rss**: remove "subsplease" search restrictions ([dfa5bb1](https://github.com/Jaeiya/aniwatch/commit/dfa5bb1))
- **flags**: `rss` flag now displays all relevant file name information and truncates title ([f68aadb](https://github.com/Jaeiya/aniwatch/commit/f68aadb))
- **utils**: strict fansub file name parsing ([bab48ee](https://github.com/Jaeiya/aniwatch/commit/bab48ee), [edfd27a](https://github.com/Jaeiya/aniwatch/commit/edfd27a))
- **watch**: delete anime from cache when last episode is watched ([a1ac244](https://github.com/Jaeiya/aniwatch/commit/a1ac244))
- **flags**: when using the `find anime` flag, it now displays the Kitsu anime profile link ([de0e27e](https://github.com/Jaeiya/aniwatch/commit/de0e27e))

### Minor Changes

- **flags**: added header to various flag display methods

### Fixes

- **kitsu**: there's a flaw in Kitsu's slug algorithm so we have to manually replace chars ([98328ef](https://github.com/Jaeiya/aniwatch/commit/98328ef))
- **rss**: entry count off by 1 (this is probably not the correct solution) ([c0ba302](https://github.com/Jaeiya/aniwatch/commit/c0ba302))

# [4.0.1](https://github.com/jaeiya/wakitsu/compare/v4.0.0...v4.0.1) (3/6/2023)

#### Fixes

- Color configuration not initialized properly ([d10f99c](https://github.com/Jaeiya/aniwatch/commit/d10f99c))
- Color configuration incorrectly defaulted to false ([c9072fe](https://github.com/Jaeiya/aniwatch/commit/c9072fe))

# [4.0.0](https://github.com/jaeiya/wakitsu/compare/v3.0.0...v4.0.0) (3/6/2023)

### Breaking Changes ([dd0fd42](https://github.com/Jaeiya/aniwatch/commit/dd0fd42))

The structure of the config file has been changed yet again, but this time it should be a lot more resilient with future updates. After this update, any changes to the config, will first check if a default value can be applied, and if so, it updates the config automatically.

Unfortunately, this time around, you'll need to delete your `wakitsu.json` config file.

### Deprecations

- **flags**: `-rt` and `--refresh-token` have been removed in favor of the new `-t` and `--token` flags

### Features

- **flags**: add `-t` and `--token` flags to alow refreshing, resetting, and displaying token information ([6330710](https://github.com/Jaeiya/aniwatch/commit/6330710))
- **flags**: add `-cl` and `--color` flags to allow toggling console color on/off ([69cbf26](https://github.com/Jaeiya/aniwatch/commit/69cbf26))
- **watch**: update episode count after each watch execution (Kitsu does not always have an accurate episode count until later in a series) ([d4bd666](https://github.com/Jaeiya/aniwatch/commit/d4bd666))
- **--profile**: added number of series currently being watched ([c98208a](https://github.com/Jaeiya/aniwatch/commit/c98208a))
- **--profile**: added how much time it will take to watch remaining series ([0ef3fe7](https://github.com/Jaeiya/aniwatch/commit/0ef3fe7))
- **cache**: now stores `slug`, `synopsis`, and `episode progress` information ([5eea47b](https://github.com/Jaeiya/aniwatch/commit/5eea47b), [7f3b4a9](https://github.com/Jaeiya/aniwatch/commit/7f3b4a9))
- **config**: added resiliency to configuration updates ([dd0fd42](https://github.com/Jaeiya/aniwatch/commit/dd0fd42))

### Minor Changes

- **config**: move configuration into its own Class and use it as a global state for the application ([d8a3e19](https://github.com/Jaeiya/aniwatch/commit/d8a3e19))

### Fixes

- **kitsu**: save token expiration when token is refreshed ([e7bf773](https://github.com/Jaeiya/aniwatch/commit/e7bf773))

# [3.0.0](https://github.com/jaeiya/wakitsu/compare/v2.0.1...v3.0.0) (2/28/2023)

### Breaking Changes ([3d5b335](https://github.com/Jaeiya/aniwatch/commit/3d5b335))

The `wakitsu.json` configuration file will now store the auth token expiration date. This means that you'll need to delete your existing `wakitsu.json` before you can use this version. In a future update, this expiration date will be used to determine when you need to refresh your auth token.

Authentication tokens, **once expired**, no longer allow you to refresh them. So it's very important to know when it's about to expire.

### Features

#### Console Logger ([30406d8](https://github.com/Jaeiya/aniwatch/commit/30406d8), [49e5f35](https://github.com/Jaeiya/aniwatch/commit/49e5f35))

This module has been effectively re-written, in order to make coloring the text a bit more intuitive and less cumbersome. It now also supports custom colors, which will be implemented in future updates.

### Changes

- **cli**: add animated loading log for longer running processes ([79be9726](https://github.com/jaeiya/wakitsu/commit/79be972650ebbedf308c64752592ba1dd8f330a5))
- **default-flag**: add another help alias ([0ac2ce6e](https://github.com/jaeiya/wakitsu/commit/0ac2ce6e02ab7ba5d44ee23d4b4fea8b1c3eae2a))
- **utils**: `tryCatchAsync()` is now more type-safe ([ceb15dca](https://github.com/jaeiya/wakitsu/commit/ceb15dca5c06057fb9668d9b719550ce5c42ba0e))

### Fixes

- **kitsu**: not all API errors were handled properly ([ff890ca](https://github.com/Jaeiya/aniwatch/commit/ff890ca))
- **kitsu**: zod failed parse when user not found ([8aea34b](https://github.com/Jaeiya/aniwatch/commit/8aea34b))

# [2.0.1](https://github.com/jaeiya/wakitsu/compare/v2.0.0...v2.0.1) (2/19/2023)

### Changes

- **chore**: update all dependencies ([145fd856](https://github.com/jaeiya/wakitsu/commit/145fd8567df5931591b4e93906d1c7371e48d3fb))
- **kitsu**: save config files as `wakitsu.json` instead of `aniwatch.json` ([421c0049](https://github.com/jaeiya/wakitsu/commit/421c00494c1e4ffcfae0261512325cdc8108104b))
- all help has been updated to use new `wakitsu` name and `wak` command name ([3f2cc469](https://github.com/jaeiya/wakitsu/commit/3f2cc4691e53b72e5a438d10b8bf3cad09c722d2))

# [2.0.0](https://github.com/jaeiya/wakitsu/compare/v1.3.1...v2.0.0) (2/19/2023)

### Project Rename

As you read through the changelog, you'll see that the program is referred to as "aniwatch". With this update, the project has been renamed to "wakitsu". From now on, you can access this program using the `wak` command instead of `aniwatch`.

### Breaking Changes

This update comes with a new configuration schema design, which removes the need for an `.aniwatch.cache` file. The cache is now built right into the `aniwatch.json` file. Because of this change, if you're missing the new cache object, the program will error out.

The solution is to simply delete your `aniwatch.json` file and let the program re-authenticate you. This will rebuild the cache, as well as all other relevant data. **This will have no effect on your Kitsu data.** Your Kitsu data is safely stored on Kitsu itself.

### Public Release

You can now install this package from NPM `npm i wakitsu`. I wasn't planning on making this package public, but if others can benefit from it the way I have, then why not. I'm sure this is a pretty niche use-case to begin with, so...I doubt there will be that much traction.

### "Watched" folder analytics

Added new `-dir` flag that displays folder analytics for the "watched" folder. Most of the statistics are fairly arbitrary, but some of them can be useful, especially the one telling you how large the 'watched' folder is. If you don't have a very big hard drive, that stat might clue you in that you need to delete some files.

Some other stats are: the oldest file, the newest file, and the largest file. Admittedly this was more of a "fun" feature to add, than a necessity.

### Minor Features

- store total episode count in cache and display it as part of a successful "watch" execution ([48a11f24](https://github.com/jaeiya/wakitsu/commit/48a11f24d4eb5221ba44fc000186e85e796934c1))
- add this changelog ([5871d42d](https://github.com/jaeiya/wakitsu/commit/5871d42d5ea96903be15589293de0f33e9bfb762))

### Fixes

- **watch**: do not exit when creating watched directory ([a985095a](https://github.com/jaeiya/wakitsu/commit/a985095aefe6ba2501663f79316f017e0034a8f6))

# [1.3.1](https://github.com/jaeiya/wakitsu/compare/v1.3.0...v1.3.1) (2/14/2023)

### Changes

- code cleanup and package description update

# [1.3.0](https://github.com/jaeiya/wakitsu/compare/v1.2.0...v1.3.0) (2/14/2023)

### Changes

- **rss-flag**: execution speed increased ~90% using [Cheerio](https://github.com/cheeriojs/cheerio) package. ([32a2d549](https://github.com/jaeiya/wakitsu/commit/32a2d54967862801abf478d856c68c501d4d3bc5))

# [1.2.0](https://github.com/jaeiya/wakitsu/compare/v1.1.1...v1.2.0) (2/13/2023)

### Features

- **help**: display help about help within the "all" help list: `aniwatch -h all` ([3bd0f7f3](https://github.com/jaeiya/wakitsu/commit/3bd0f7f38b50c2a2ecd89f22d37a6856a57db29b))
- **default-flag**: add more help aliases for "how to watch" anime help ([8b8fac21](https://github.com/jaeiya/wakitsu/commit/8b8fac21e829ee66ed0adbd5f60e56f195362bb3))

### Major CLI internal re-write

Flags are now compartmentalized within their own objects and registered as such, into the CLI. This allows for flag data (aliases, help aliases, short description, etc...) to be created together, rather than strewn over multiple files.

# [1.1.1](https://github.com/jaeiya/wakitsu/compare/v1.1.0...v1.1.1) (1/31/2023)

### Features

- **help**: add more robust explanation on how help works ([32f769c4](https://github.com/jaeiya/wakitsu/commit/32f769c4a021fc5065328cc05f236bfbfdd32808))
- **help**: add more help aliases for flag discoverability ([92c0ffaf](https://github.com/jaeiya/wakitsu/commit/92c0ffaf573a3d43609e00f557ac4df2e5c7fbff), [25436697](https://github.com/jaeiya/wakitsu/commit/254366976f47c2f712ff2a617beea6abc74aa964))

### Fixes

- **help**: using incorrect alias for "rebuild-profile" flag ([543554ef](https://github.com/jaeiya/wakitsu/commit/543554efce852e062ed4eed39392a0047e4197d2))

# [1.1.0](https://github.com/jaeiya/wakitsu/compare/v1.0.2...v1.1.0) (1/30/2023)

### Full Help Support

Documented all features of the program, which are available through the help flag. You can use `aniwatch -h` to get started. Help aliases were also added as a new way to find help.

You can use `aniwatch -h find anime` or `aniwatch -h show profile` respectively for learning how to find anime or display your Kitsu profile. It should be fairly easy to figure out, within a couple words, how to find help for a feature of the program. ([7489306f](https://github.com/jaeiya/wakitsu/commit/7489306f64bf47026c27fd8c83824a2e0de0d4ad), [5f732781](https://github.com/jaeiya/wakitsu/commit/5f732781d86719cf9b92518365723b720a97707b), [1364ad5d](https://github.com/jaeiya/wakitsu/commit/1364ad5d850723ee1f0f609bcbfc02139300f275))

### Fixes

- **kitsu**: anime library URL was not able to get more than 10 results ([9711803d](https://github.com/jaeiya/wakitsu/commit/9711803d22fa978b9293ec96510b727a8cac8907))

# [1.0.2](https://github.com/jaeiya/wakitsu/compare/v1.0.1...v1.0.2) (1/28/2023)

### Fixes

- **main**: "find anime" and "rss feed" flags assigned incorrect flag names ([76c8a6bf](https://github.com/jaeiya/wakitsu/commit/76c8a6bf42e25574057bd02bbbc3a4d998e24281))

# [1.0.1](https://github.com/jaeiya/wakitsu/compare/v1.0.0...v1.0.1) (1/28/2023)

### Changes

- **cli**: more tightly couple flag execution with the CLI ([40e12710](https://github.com/jaeiya/wakitsu/commit/40e12710e304998be9b4e2189443344c2d9f34c7))

### Fixes

- **docs**: fix inline code and add **need help** section ([4c693974](https://github.com/jaeiya/wakitsu/commit/4c693974aede4bcc8b15852759693b09f1d2114f))

# [1.0.0](https://github.com/jaeiya/wakitsu/compare/v0.0.0...v1.0.0) (1/28/2023)

### Initial Release

# [0.0.0](https://github.com/Jaeiya/wakitsu/commit/23d5f45) (1/14/2023)

### Initial Commit ([23d54f45](https://github.com/jaeiya/wakitsu/commit/23d5f452becc8a869d0f58ed133ca6c869836b80))
