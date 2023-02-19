export abstract class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export class NotFound extends HttpError {
  constructor(public readonly path: string) {
    super(`Not found: ${path}`, 404);
  }
}

export class CodeError extends HttpError {
  constructor(e: Error) {
    super(`${e.name} - ${e.message}\n${e.stack}`, 500);
  }
}
