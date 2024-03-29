export type HTTPMethods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'MKCOL'
  | 'COPY'
  | 'MOVE'
  | 'LOCK'
  | 'UNLOCK'
  | 'TRACE'
  | 'SEARCH';

export interface UrlConfig {
  url: string;
  method: HTTPMethods | '*';
}
