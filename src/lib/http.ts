import { Printer } from './printer/printer.js';
import { tryCatchAsync } from './utils.js';

export class HTTP {
    static async post(url: string, body: string) {
        return this.rawPost(url, 'application/json', body);
    }

    static async postAPI(url: string, body: string, token: string) {
        return this.rawPost(url, 'application/vnd.api+json', body, token);
    }

    static async rawPost(url: string, contentType: string, body: string, token?: string) {
        const headers: { [key: string]: string } = {
            'Content-Type': contentType,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const asyncRes = await tryCatchAsync(
            fetch(url, {
                method: 'POST',
                body,
                headers,
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
    Printer.printError(resp.message, `Failed ${method}ing ;c;${url}`);
}
