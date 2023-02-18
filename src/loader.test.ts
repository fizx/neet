import { GithubLoader } from "./loader";
import * as fs from "fs";

describe("loading self", () => {
  it("some javascript", async () => {
    const loader = new GithubLoader();
    const content = await loader.load("fizx-neet.neetcode.us");
    expect(content).toEqual(fs.readFileSync("neet.js").toString());
  });
});
