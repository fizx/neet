import LRUCache from "lru-cache";
import {
  getQuickJS,
  QuickJSContext,
  QuickJSWASMModule,
} from "quickjs-emscripten";
import fs from "fs/promises";
import path from "path";
import { CodeError, NotFound } from "./errors";

export interface Evaluator {
  close(): void;
  // eslint-disable-next-line
  eval(code: string): Promise<any>;
}

export interface Loader {
  load(host: string): Promise<Evaluator>;
}

export interface Fetcher {
  load(host: string): Promise<string>;
}

export class LocalFetcher implements Fetcher {
  constructor(private root: string) {}

  async load(host: string): Promise<string> {
    const left = host.split(".")[0];
    const file = path.join(this.root, left, "neet.js");

    try {
      return await fs.readFile(file, "utf8");
    } catch (e) {
      throw new NotFound(file);
    }
  }
}

export class GithubFetcher implements Fetcher {
  async load(host: string): Promise<string> {
    const leftmost = host.split(".")[0];
    let user = leftmost.split("-")[0];
    let repo = leftmost.split("-")[1];
    if (!repo) {
      user = "fizx";
      repo = "neet";
    }
    const url = `https://raw.githubusercontent.com/${user}/${repo}/main/neet.js`;
    console.log(`fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new NotFound(`github.com/${user}/${repo}/neet.js`);
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
    const qjs = await this.quickJS;
    const content = await this.fetcher.load(host);
    const vm = qjs.newContext();
    await this.eval(vm, "globalThis = this;module = {};" + content);
    const serve = await this.eval(
      vm,
      "module.exports && module.exports.serve;"
    );
    if (!serve) {
      throw new Error("Module must export a 'serve' function");
    }
    const evaluator = new QuickJSEvaluator(this, vm);
    return evaluator;
  }

  executePendingJobs(vm: QuickJSContext) {
    if (vm.runtime.alive) {
      if (vm.runtime.hasPendingJob()) {
        vm.runtime.executePendingJobs();
      }
      return true;
    } else {
      return false;
    }
  }

  async eval(vm: QuickJSContext, code: string) {
    const result = vm.evalCode(code);

    if (result.error) {
      const json = vm.dump(result.error);
      result.error.dispose();
      throw new CodeError(json);
    } else {
      try {
        const p = vm.resolvePromise(result.value);
        this.executePendingJobs(vm);
        const val = await p;
        if (val.error) {
          const err = new Error(JSON.stringify(vm.dump(val.error)));
          val.error.dispose();
          throw err;
        } else {
          try {
            return vm.dump(val.value);
          } finally {
            val.value.dispose();
          }
        }
      } catch (e) {
        console.log("what?", e);
      } finally {
        result.value.dispose();
      }
    }
  }
}

export class QuickJSEvaluator implements Evaluator {
  handle: NodeJS.Timer;
  constructor(private loader: QuickJSLoader, private vm: QuickJSContext) {
    this.handle = setInterval(this.executePendingJobs.bind(this), 10);
  }

  executePendingJobs() {
    if (!this.loader.executePendingJobs(this.vm)) {
      clearInterval(this.handle);
    }
  }

  async eval(code: string) {
    return this.loader.eval(this.vm, code);
  }

  close() {
    this.vm.dispose();
    clearInterval(this.handle);
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
