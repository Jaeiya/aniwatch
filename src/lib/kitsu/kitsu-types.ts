import { ConfigFile } from './kitsu-schemas.js';

export type AuthTokenResp = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
};

export type KitsuAuthTokens = Pick<AuthTokenResp, 'access_token'> &
    Pick<AuthTokenResp, 'refresh_token'>;

export type LibraryPatchData = {
    data: {
        id: string;
        type: 'library-entries';
        attributes: {
            progress: number;
        };
    };
};

export type SerializedAnime = {
    title_jp: string;
    title_en: string;
    progress: number;
    rating: string | number | null;
    totalEpisodes: number | null;
    avgRating: string;
};

export type AnimeCache = [
    libraryID: string,
    cannonTitle: string,
    englishTitle: string,
    episodeCount: number
][];

export type KitsuCache = ConfigFile['cache'];
export type KitsuConfig = [isNew: boolean, config: ConfigFile];
