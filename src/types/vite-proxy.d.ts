import { ServerResponse, IncomingMessage } from 'http';
import { ProxyReqCallback, ProxyResCallback } from 'http-proxy';

declare module 'http' {
  interface IncomingMessage {
    body?: any;
  }
}

export interface ViteProxyOptions {
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  headers: Record<string, string>;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  onProxyReq?: ProxyReqCallback;
  onProxyRes?: ProxyResCallback;
  onError?: (err: Error, req: IncomingMessage, res: ServerResponse) => void;
}

export interface ViteProxyConfig {
  [path: string]: ViteProxyOptions;
}
