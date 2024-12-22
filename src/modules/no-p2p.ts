import { noop } from 'foxts/noop';
import { logger } from '../logger';
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';

// 防止叔叔用 P2P CDN 省下纸钱

const rBackupCdn = /up[\w-]+\.bilivideo\.com/;

const noP2P: MakeBilibiliGreatThanEverBeforeModule = {
  any() {
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
  },
  onVideoOrBangumi({ onBeforeFetch, onXhrOpen }) {
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

    onXhrOpen((xhrOpenArgs) => {
      try {
        xhrOpenArgs[1] = replaceP2P(
          new URL(xhrOpenArgs[1]),
          rBackupCdn.exec(document.head.innerHTML)?.[0]
        ).href;
      } catch (e) {
        logger.error('Failed to replace P2P for XMLHttpRequest.prototype.open', e);
      }

      return xhrOpenArgs;
    });

    onBeforeFetch((fetchArgs: [RequestInfo | URL, RequestInit?]) => {
      try {
        const cdnDomain = rBackupCdn.exec(document.head.innerHTML)?.[0];

        let input = fetchArgs[0];
        if (typeof input === 'string') {
          input = replaceP2P(new URL(input), cdnDomain).href;
        } else if (input instanceof Request) {
          input = new Request(replaceP2P(new URL(input.url), cdnDomain).href, input);
        } else if (input instanceof URL) {
          input = replaceP2P(input, cdnDomain);
        } else {
          input = replaceP2P(new URL(String(input)), cdnDomain).href;
        }

        fetchArgs[0] = input;
      } catch (e) {
        logger.error('Failed to replace P2P for fetch', e);
      }

      return fetchArgs;
    });
  }
};

export default noP2P;

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
