import { tryCatchAsync } from './utils.js';

export class HTTP {
    static async post(url: string, body: string) {
        const asyncRes = await tryCatchAsync(
            fetch(url, {
                method: 'POST',
                body,
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        );
        if (!asyncRes.success) {
            execError(asyncRes.error, 'POST', url.toString());
            process.exit(1);
        }
        return asyncRes.data;
    }

    static async get(url: URL, token?: string) {
        const headers = token ? { Authorization: `Bearer ${token}` } : null;
        const asyncResp = await tryCatchAsync(
            fetch(url, headers ? { method: 'GET', headers } : { method: 'GET' })
        );
        if (!asyncResp.success) {
            execError(asyncResp.error, 'GET', url.toString());
            process.exit(1);
        }
        return asyncResp.data;
    }

    static async patch(url: URL, body: string, token: string) {
        const asyncRes = await tryCatchAsync(
            fetch(url, {
                method: 'PATCH',
                body,
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    Authorization: `Bearer ${token}`,
                },
            })
        );
        if (!asyncRes.success) {
            execError(asyncRes.error, 'PATCH', url.toString());
            process.exit(1);
        }
        return asyncRes.data;
    }
}

function execError(resp: Error, method: string, url: string) {
    _con.chainError(['', `;r;Failed ${method}ing ${url}`, resp.message]);
}
