import express from "express";
import { CachingLoader, GithubFetcher, QuickJSLoader } from "./loader";
import { Server } from "./server";
import bodyParser from "body-parser";

export const app = express();
app.use(bodyParser.text());

const loader = new CachingLoader(new QuickJSLoader(new GithubFetcher()), 100);
const server = new Server(loader);

app.get("*", async (req, res) => {
  await server.handleRequest(req, res);
});

app.post("*", async (req, res) => {
  await server.handleRequest(req, res);
});
