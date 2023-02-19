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
