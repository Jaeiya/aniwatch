export class KitsuUrlAPI {
    #url: URL;

    constructor(url: string) {
        this.#url = new URL(url);
    }

    get url() {
        return this.#url;
    }

    setQueryText(text: string) {
        this.#url.searchParams.append('filter[text]', text);
        return this;
    }

    setPageLimit(limit: number) {
        this.#url.searchParams.append('page[limit]', limit.toString());
        return this;
    }

    filterAnimeFields(fields: string[]) {
        this.#url.searchParams.append(`fields[anime]`, fields.join(','));
        return this;
    }

    filterUserName(name: string) {
        this.#url.searchParams.append('filter[name]', name);
        return this;
    }

    filterUserID(id: string) {
        this.#url.searchParams.append('filter[user_id]', id);
        return this;
    }

    filterLibraryID(ids: string[]) {
        this.#url.searchParams.append('filter[id]', ids.join(','));
        return this;
    }

    filterAnimeType(type: 'tv' | 'movie' | 'ova') {
        this.#url.searchParams.append(`filter[subtype]`, type);
        return this;
    }

    filterStatus(status: 'current' | 'dropped' | 'planned' | 'completed' | 'finished') {
        this.#url.searchParams.append('filter[status]', status);
        return this;
    }

    filterMediaType(type: 'manga' | 'anime') {
        this.#url.searchParams.append('filter[kind]', type);
        return this;
    }

    includeCategory(categories: string[]) {
        this.#url.searchParams.append('include', categories.join(','));
        return this;
    }
}
