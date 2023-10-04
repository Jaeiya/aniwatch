import { Config } from '../config.js';
import { KitsuUrlAPI } from './kitsu-url-api.js';

export class KitsuURLs {
    static getAnimeInfoURL(queryText: string, status?: 'current' | 'finished') {
        return new KitsuUrlAPI('https://kitsu.io/api/edge/anime')
            .setQueryText(queryText)
            .setPageLimit(5)
            .filterAnimeType('tv')
            .filterStatus(status ?? 'current')
            .filterAnimeFields([
                'titles',
                'canonicalTitle',
                'abbreviatedTitles',
                'averageRating',
                'episodeCount',
                'slug',
                'synopsis',
            ]).url;
    }

    static getLibraryAnimeInfoURL(animeLibraryIDs: string[]) {
        return new KitsuUrlAPI('https://kitsu.io/api/edge/library-entries')
            .filterLibraryID(animeLibraryIDs)
            .includeCategory(['anime'])
            .filterAnimeFields(['episodeCount', 'averageRating', 'synopsis'])
            .setPageLimit(200).url;
    }

    static getWatchListURL() {
        return new KitsuUrlAPI(Config.getKitsuProp('urls').library)
            .filterStatus('current')
            .setPageLimit(200)
            .includeCategory(['anime']).url;
    }
}
