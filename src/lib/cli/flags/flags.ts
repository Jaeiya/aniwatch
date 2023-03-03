import { DefaultFlag } from './flag-default.js';
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

export const Flags = [
    DefaultFlag,
    HelpFlag,
    ProfileFlag,
    RebuildProfileFlag,
    CacheFlag,
    RebuildCacheFlag,
    ColorFlag,
    DirInfoFlag,
    TokenFlag,
    FindAnimeFlag,
    RSSFeedFlag,
];
