import express from "express";
import { Server } from "./server";

export const app = express();
const server = new Server();

app.get("*", async (req, res) => {
  await server.handleRequest(req, res);
});

app.post("*", async (req, res) => {
  await server.handleRequest(req, res);
});
