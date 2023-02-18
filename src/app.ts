import express from "express";
import { Server } from "./server";

export const app = express();
const server = new Server();

app.get("*", (req, res) => {
  server.handleRequest(req, res);
});

app.post("*", (req, res) => {
  server.handleRequest(req, res);
});
