declare module 'express' {
  export interface Request {
    headers: Record<string, any>;
    [key: string]: any;
  }

  export interface Response {
    setHeader(name: string, value: string): void;
    send(body: any): void;
  }
}
