import { DefaultFlag } from './flag-watch.js';
import { DirInfoFlag } from './flag-dir-size.js';
import { FindAnimeFlag } from './flag-find-anime.js';
import { HelpFlag } from './flag-help.js';
import { ProfileFlag } from './flag-profile.js';
import { RebuildCacheFlag } from './flag-rebuild-cache.js';
import { RebuildProfileFlag } from './flag-rebuild-profile.js';
import { RSSFeedFlag } from './flag-rss-feed.js';
import { CacheFlag } from './flag-cache.js';
import { TokenFlag } from './flag-token.js';
import { ColorFlag } from './flag-color.js';
import { CleanFlag } from './flag-clean.js';
import { TestFlag } from './flag-test.js';
import { AddAnime } from './flag-add-anime.js';

export const Flags = [
    DefaultFlag,
    HelpFlag,
    ProfileFlag,
    RebuildProfileFlag,
    CacheFlag,
    RebuildCacheFlag,
    ColorFlag,
    DirInfoFlag,
    CleanFlag,
    TokenFlag,
    FindAnimeFlag,
    RSSFeedFlag,
    AddAnime,
    TestFlag,
];
