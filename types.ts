export interface SimpleRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface SimpleResponse {
  status: number;
  headers?: Record<string, string>;
  body: Buffer | Uint8Array | string;
}

export interface Service {
  serve(req: SimpleRequest): Promise<SimpleResponse>;
}
