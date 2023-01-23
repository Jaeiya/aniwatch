import { Logger } from './logger.js';
import { tryCatchAsync } from './utils.js';

const _cc = Logger.consoleColors;

export class HTTP {
  static async post(url: string, body: string) {
    const resp = await tryCatchAsync(
      fetch(url, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    if (resp instanceof Error) {
      execError(resp, 'POST', url.toString());
      process.exit(1);
    }
    return resp;
  }

  static async get(url: URL, token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : null;
    const resp = await tryCatchAsync(
      fetch(url, headers ? { method: 'GET', headers } : { method: 'GET' })
    );
    if (resp instanceof Error) {
      execError(resp, 'GET', url.toString());
      process.exit(1);
    }
    return resp;
  }

  static async patch(url: URL, body: string, token: string) {
    const resp = await tryCatchAsync(
      fetch(url, {
        method: 'PATCH',
        body,
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    if (resp instanceof Error) {
      execError(resp, 'PATCH', url.toString());
      process.exit(1);
    }
    return resp;
  }
}

function execError(resp: Error, method: string, url: string) {
  if (resp instanceof Error) {
    Logger.chainError(['', `${_cc.rd}Failed ${method}ing ${url}`, resp.message]);
  }
}
