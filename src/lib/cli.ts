import readline from 'readline';

export class CLI {
  static async prompt(query: string) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((rs) => {
      rl.question(query, rs);
    });
    rl.close();
    return answer;
  }
}
