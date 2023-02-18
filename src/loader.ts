import LRUCache from "lru-cache";
import {
  getQuickJS,
  QuickJSContext,
  QuickJSWASMModule,
} from "quickjs-emscripten";

// eslint-disable-next-line
type CB = (arg: any) => void;

export interface Evaluator {
  eval(code: string, cb?: CB): Promise<void>;
}

export interface Loader {
  load(host: string): Promise<Evaluator>;
}

export interface Fetcher {
  load(host: string): Promise<string>;
}

export class GithubFetcher implements Fetcher {
  async load(host: string): Promise<string> {
    if (host.endsWith("neetcode.us")) {
      host = "fizx-neet.neetcode.us";
    }
    const leftmost = host.split(".")[0];
    const user = leftmost.split("-")[0];
    const repo = leftmost.split("-")[1];

    const url = `https://raw.githubusercontent.com/${user}/${repo}/main/neet.js`;
    console.log(`fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}`);
      throw new Error(`Failed to fetch ${url}`);
    }
    console.log(`fetched ${url}!`);
    return response.text();
  }
}

export class QuickJSLoader implements Loader {
  quickJS: Promise<QuickJSWASMModule>;
  constructor(private fetcher: Fetcher) {
    this.quickJS = getQuickJS();
  }
  async load(host: string): Promise<Evaluator> {
    const content = await this.fetcher.load(host);
    const evaluator = new QuickJSEvaluator(await this.quickJS, content);
    return evaluator;
  }
}

export class QuickJSEvaluator implements Evaluator {
  private vm: QuickJSContext;
  constructor(private quickJS: QuickJSWASMModule, private content: string) {
    this.vm = quickJS.newContext();
    console.log("initializing quickjs evaluator...");
    this.eval("globalThis = this;module = {};");
    this.eval(this.content);
    console.log("initialized quickjs evaluator!");
    setInterval(() => {
      if (this.vm.runtime.hasPendingJob()) {
        this.vm.runtime.executePendingJobs();
      }
    }, 100);
  }

  async eval(code: string, cb?: CB) {
    const result = this.vm.evalCode(code);

    if (result.error) {
      const err = new Error(JSON.stringify(this.vm.dump(result.error)));
      result.error.dispose();
      throw err;
    } else {
      const p = this.vm.resolvePromise(result.value);
      try {
        const val = await p;
        if (val.error) {
          const err = new Error(JSON.stringify(this.vm.dump(val.error)));
          val.error.dispose();
          throw err;
        } else {
          try {
            if (cb) cb(this.vm.dump(val.value));
          } finally {
            val.value.dispose();
          }
        }
      } finally {
        result.value.dispose();
      }
    }
  }
}

export class CachingLoader implements Loader {
  private cache: LRUCache<string, Evaluator>;

  constructor(private loader: Loader, private cacheSize: number) {
    this.cache = new LRUCache({
      maxSize: cacheSize,
      sizeCalculation: (_key, _value) => {
        return 1;
      },
    });
  }

  async load(host: string): Promise<Evaluator> {
    const cached = this.cache.get(host);
    if (cached) {
      return cached;
    }

    const content = await this.loader.load(host);
    this.cache.set(host, content);
    return content;
  }
}
