import { tryCatchAsync } from './utils.js';

export class HTTP {
  static post(url: string, body: string) {
    return tryCatchAsync(
      fetch(url, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  }
  static get(url: URL, token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : null;
    return tryCatchAsync(
      fetch(url, headers ? { method: 'GET', headers } : { method: 'GET' })
    );
  }
}
