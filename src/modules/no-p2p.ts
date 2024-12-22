import { noop } from 'foxts/noop';
import { logger } from '../logger';

// 防止叔叔用 P2P CDN 省下纸钱
export default function noP2P() {
  class MockPCDNLoader { }

  class MockBPP2PSDK {
    on = noop;
  }

  class MockSeederSDK { }

  Object.defineProperty(unsafeWindow, 'PCDNLoader', {
    get() {
      return MockPCDNLoader;
    },
    set: noop,
    enumerable: true,
    configurable: false
  });
  Object.defineProperty(unsafeWindow, 'BPP2PSDK', {
    get() {
      return MockBPP2PSDK;
    },
    set: noop,
    enumerable: true,
    configurable: false
  });
  Object.defineProperty(unsafeWindow, 'SeederSDK', {
    get() {
      return MockSeederSDK;
    },
    set: noop,
    enumerable: true,
    configurable: false
  });

  let cdnDomain: string | undefined;
  if (location.href.startsWith('https://www.bilibili.com/video/') || location.href.startsWith('https://www.bilibili.com/bangumi/play/')) {
    cdnDomain ||= (/up[\w-]+\.bilivideo\.com/.exec(document.head.innerHTML))?.[0];

    // Patch new Native Player
    (function (HTMLMediaElementPrototypeSrcDescriptor) {
      Object.defineProperty(globalThis.HTMLMediaElement.prototype, 'src', {
        ...HTMLMediaElementPrototypeSrcDescriptor,
        set(value: any) {
          if (typeof value !== 'string') {
            value = String(value);
          }
          let newValue: string;
          try {
            newValue = replaceP2P(new URL(value)).href;
          } catch (e) {
            logger.error('Failed to handle HTMLMediaElement.prototype.src setter', e);
            newValue = value;
          }

          HTMLMediaElementPrototypeSrcDescriptor?.set?.call(this, newValue);
        }
      });
    }(Object.getOwnPropertyDescriptor(globalThis.HTMLMapElement.prototype, 'src')));

    (function (open) {
      globalThis.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest['open']>) {
        try {
          args[1] = replaceP2P(new URL(args[1]), cdnDomain).href;
        } catch (e) {
          logger.error('Failed to replace P2P for XMLHttpRequest.prototype.open', e);
        }
        return Reflect.apply(open, this, args);
      } as typeof XMLHttpRequest.prototype.open;
      // eslint-disable-next-line @typescript-eslint/unbound-method -- called with Reflect.apply
    }(globalThis.XMLHttpRequest.prototype.open));

    (function ($fetch) {
      globalThis.fetch = async function (this: unknown, input: URL | RequestInfo, init?: RequestInit) {
        try {
          if (typeof input === 'string') {
            input = replaceP2P(new URL(input), cdnDomain).href;
          } else if (input instanceof Request) {
            input = new Request(replaceP2P(new URL(input.url), cdnDomain).href, input);
          } else if (input instanceof URL) {
            input = replaceP2P(input, cdnDomain).href;
          } else {
            input = replaceP2P(new URL(String(input)), cdnDomain).href;
          }
        } catch (e) {
          logger.error('Failed to replace P2P for fetch', e);
        }
        return Reflect.apply($fetch, this, [input, init]);
      };
    }(globalThis.fetch));
  }
}

function replaceP2P(url: URL, cdnDomain = 'upos-sz-mirrorcoso1.bilivideo.com') {
  try {
    const hostname = url.hostname;
    if (hostname.endsWith('.mcdn.bilivideo.cn')) {
      url.hostname = cdnDomain;
      url.port = '443';
      logger.info(`P2P replaced: ${hostname} -> ${cdnDomain}`);
    } else if (hostname.endsWith('.szbdyd.com')) {
      const xy_usource = url.searchParams.get('xy_usource');
      if (xy_usource) {
        url.hostname = xy_usource;
        url.port = '443';
        logger.info(`P2P replaced: ${hostname} -> ${xy_usource}`);
      }
    }

    return url;
  } catch (e) {
    logger.error(`Failed to replace P2P for URL (${url.href}):`, e);
    return url;
  }
}
