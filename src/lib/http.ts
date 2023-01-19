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
}
