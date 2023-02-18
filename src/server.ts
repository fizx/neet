import { Request, Response } from "express";
import { SimpleRequest } from "../types";
import { Loader } from "./loader";

function simplifyHeaders(
  headers: NodeJS.Dict<string | string[]>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      result[key] = value.join(", ");
    } else if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export class Server {
  constructor(private loader: Loader) {}
  async handleRequest(req: Request, res: Response) {
    const ev = await this.loader.load(req.hostname);
    const simple: SimpleRequest = {
      method: req.method,
      url: req.url,
      headers: simplifyHeaders(req.headers),
      body: req.body,
    };
    try {
      await ev.eval(
        `module.exports.serve(${JSON.stringify(simple)})`,
        (result) => {
          if (typeof result === "object" && result !== null) {
            const { status, headers, body } = result as {
              status: number;
              headers: Record<string, string>;
              body: string;
            };
            res.status(status).set(headers).send(body);
          } else {
            res.status(500).send("Internal Server Error");
          }
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal Server Error");
    }
  }
}
