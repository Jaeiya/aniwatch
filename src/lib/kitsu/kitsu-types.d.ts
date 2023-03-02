import { KitsuData } from './kitsu-schemas.ts';

export type TokenGrantResp = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
};

export type KitsuTokenData = Pick<TokenGrantResp, 'access_token'> &
    Pick<TokenGrantResp, 'refresh_token'> &
    Pick<TokenGrantResp, 'expires_in'>;

export type KitsuSerializedTokenData = {
    access_token: string;
    refresh_token: string;
    token_expiration: number;
};

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

export type KitsuCache = KitsuData['cache'];
export type KitsuConfig = [isNew: boolean, config: KitsuData];
