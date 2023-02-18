import { Request, Response } from "express";

export class Server {
  handleRequest(req: Request, res: Response) {
    res.send("Hello, world!");
  }
}
