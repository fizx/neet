import { SimpleRequest, SimpleResponse } from "../types";

export async function serve(_req: SimpleRequest): Promise<SimpleResponse> {
  return {
    status: 200,
    body: "Hello, world! from the inside!",
  };
}
