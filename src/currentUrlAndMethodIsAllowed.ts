import { HTTPMethods, UrlConfig } from './type';

const methods: HTTPMethods[] = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
  'OPTIONS',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
  'TRACE',
  'SEARCH',
];

const addUrl = (
  u: string,
  m: HTTPMethods | '*',
  urls: UrlConfig[],
): UrlConfig[] => {
  if (m === '*') {
    for (const HTTPMethod of methods) {
      urls.push({ url: u, method: HTTPMethod });
    }
  } else {
    urls.push({ url: u, method: m as HTTPMethods });
  }

  return urls;
};

export const currentUrlAndMethodIsAllowed = (
  url: string,
  method: HTTPMethods,
  config: UrlConfig[],
): boolean => {
  let urlsConfig: UrlConfig[] = [];
  let result = false;

  for (let i = 0, len = config.length; i < len; i += 1) {
    const val = config[i];
    urlsConfig = addUrl(val.url, val.method, urlsConfig);
  }

  let currentUrl = url;

  // Remove Query Params
  currentUrl = currentUrl.split('?')[0];

  // Remove last slash to be sure to have same url
  if (currentUrl !== '/' && currentUrl.slice(-1) === '/') {
    currentUrl = currentUrl.slice(0, -1);
  }

  for (let index = 0; index < urlsConfig.length; index += 1) {
    const urlConfig: UrlConfig = urlsConfig[index];

    //If url ends with *, just check that url is similar without *
    if (urlConfig.url.endsWith('/*')) {
      if (currentUrl.startsWith(urlConfig.url.replace('/*', ''))) {
        result = true;
        break;
      }
    }

    // Check current url and current method are in config
    if (currentUrl === urlConfig.url && method === urlConfig.method) {
      result = true;
      break;
    }

    // Ignore dynamic paremeters and check
    if (urlConfig.url.indexOf('/:') !== -1) {
      const splitUrl = currentUrl.split('/');
      const splitConfigUrl = urlConfig.url.split('/');

      if (
        splitUrl.length === splitConfigUrl.length &&
        method === urlConfig.method
      ) {
        let similar = true;
        for (let j = 0; j < splitUrl.length; j += 1) {
          if (
            splitConfigUrl[j].indexOf(':') === -1 &&
            splitUrl[j] !== splitConfigUrl[j]
          ) {
            similar = false;
            break;
          }
        }

        // If Everything is similar (with parameters and method)
        if (similar) {
          result = true;
          break;
        }
      }
    }
  }

  return result;
};
