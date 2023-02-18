export interface Loader {
  load(host: string): Promise<string>;
}

export class GithubLoader {
  async load(host: string): Promise<string> {
    const leftmost = host.split(".")[0];
    const user = leftmost.split("-")[0];
    const repo = leftmost.split("-")[1];

    const url = `https://raw.githubusercontent.com/${user}/${repo}/neet.js`;
    const response = await fetch(url);
    return response.text();
  }
}
