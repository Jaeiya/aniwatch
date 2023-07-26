import { DefaultFlag } from './flag-watch.js';
import { Directory } from './flag-dir.js';
import { FindAnimeFlag } from './flag-find-anime.js';
import { HelpFlag } from './flag-help.js';
import { ProfileFlag } from './flag-profile.js';
import { RSSFeedFlag } from './flag-rss-feed.js';
import { CacheFlag } from './flag-cache.js';
import { TokenFlag } from './flag-token.js';
import { ColorFlag } from './flag-color.js';
import { TestFlag } from './flag-test.js';

export const Flags = [
    DefaultFlag,
    HelpFlag,
    ProfileFlag,
    CacheFlag,
    ColorFlag,
    Directory,
    TokenFlag,
    FindAnimeFlag,
    RSSFeedFlag,
    TestFlag,
];
