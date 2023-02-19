import { CachingLoader, LocalFetcher, QuickJSLoader } from "./loader";
import path from "path";
import { NotFound, CodeError } from "./errors";

const tests = path.join(__dirname, "..", "tests");

describe("loading self", () => {
  it("should load and execute ping", async () => {
    const loader = new QuickJSLoader(new LocalFetcher(tests));
    const evals = await loader.load("fizx-ping.neetcode.us");
    try {
      const req = {
        method: "GET",
        url: "/",
        headers: {},
      };
      const rsp = await evals.eval(
        `module.exports.serve(${JSON.stringify(req)})`
      );
      expect(rsp).toEqual({
        status: 200,
        headers: { "Content-Type": "text/plain" },
        body: "hello: /",
      });
    } finally {
      evals.close();
    }
  });

  it("should not load 404", async () => {
    const loader = new QuickJSLoader(new LocalFetcher(tests));
    await expect(loader.load("fizx-404.neetcode.us")).rejects.toThrow(NotFound);
  });

  it("throws an error when loading an invalid or malformed NeetCode file", async () => {
    const loader = new QuickJSLoader(new LocalFetcher(tests));
    await expect(loader.load("invalid.neetcode.us")).rejects.toThrow(CodeError);
  });

  it("throws an error when loading a module without a serve function", async () => {
    const loader = new QuickJSLoader(new LocalFetcher(tests));
    await expect(loader.load("noserve.neetcode.us")).rejects.toThrow(
      "Module must export a 'serve' function"
    );
  });

  it("caches the evaluator", async () => {
    const fetcher = new LocalFetcher(tests);
    const loader = new CachingLoader(new QuickJSLoader(fetcher), 100);
    const spy = jest.spyOn(fetcher, "fetch");
    const evals = await loader.load("fizx-ping.neetcode.us");
    const evals2 = await loader.load("fizx-ping.neetcode.us");
    expect(evals).toBe(evals2);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
