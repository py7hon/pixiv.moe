// modify from https://www.sitepoint.com/cache-fetched-ajax-requests/
import hashStr from '@/utils/hashStr';
import moment from '@/utils/moment';
import Storage from '@/utils/Storage';

function buildURL(url, params) {
  if (!params) {
    return url;
  }

  const uris = [];

  Object.keys(params).forEach(key => {
    let value = params[key];
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    uris.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });

  url += (url.indexOf('?') === -1 ? '?' : '&') + uris.join('&');

  return url;
}

function getContent(content) {
  try {
    content = JSON.parse(content);
  } catch (e) {}
  return content;
}

export default function cachedFetch(url, options = {}) {
  let cacheKey = undefined;

  if (
    (typeof options.method === 'undefined' ||
      options.method.toLowerCase() === 'get') &&
    typeof options.data === 'object'
  ) {
    url = buildURL(url, options.data);
  }

  if (typeof options.expiryKey === 'string') {
    // Use the URL as the cache key to localStorage
    cacheKey = 'cf_' + hashStr(url);
    const cached = Storage.get(cacheKey);

    const cachedExpiresAt = Storage.get(cacheKey + ':ts');
    if (cached !== null && cachedExpiresAt !== null) {
      // it was in localStorage! Yay!
      if (moment().unix() < parseInt(cachedExpiresAt, 10)) {
        const response = new Response(new Blob([JSON.stringify(cached)]));
        return response
          .clone()
          .text()
          .then(content => {
            content = getContent(content);
            return content;
          });
      }
      // We need to clean up this old key
      Storage.remove(cacheKey).remove(cacheKey + ':ts');
    }
  }

  return new Promise((resolve, reject) => {
    if (options.timeout > 0) {
      setTimeout(() => {
        reject(new Error('request timeout'));
      }, options.timeout);
    }
    fetch(url, options).then(response => {
      // let fetch supports timeout
      // let's only store in cache if the content-type is
      // JSON or something non-binary
      if (response.status === 200) {
        const ct = response.headers.get('Content-Type');
        if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
          response
            .clone()
            .text()
            .then(content => {
              content = getContent(content);
              if (typeof options.expiryKey === 'string') {
                Storage.set(cacheKey, content).set(
                  cacheKey + ':ts',
                  content[options.expiryKey]
                );
              }
            });
        }
        if (options.blob === true) {
          resolve(response.blob());
        } else {
          resolve(response.json());
        }
      }
      reject(new Error('response is not OK'));
    });
  });
}
