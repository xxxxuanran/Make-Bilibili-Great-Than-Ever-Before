import { noop } from 'foxts/noop';
import { logger } from './logger';
import defuseSpyware from './modules/defuse-spyware';
import enhanceLive from './modules/enhance-live';
import fixCopyInCV from './modules/fix-copy-in-cv';
import noAd from './modules/no-ad';
import noP2P from './modules/no-p2p';
import noWebRTC from './modules/no-webtrc';
import optimizeHomepage from './modules/optimize-homepage';
import optimizeStory from './modules/optimize-story';
import playerVideoFit from './modules/player-video-fit';
import removeBlackBackdropFilter from './modules/remove-black-backdrop-filter';
import removeUselessUrlParams from './modules/remove-useless-url-params';
import useSystemFonts from './modules/use-system-fonts';
import type { OnXhrOpenHook } from './types';
import type { MakeBilibiliGreatThanEverBeforeHook, MakeBilibiliGreatThanEverBeforeModule, OnBeforeFetchHook } from './types';
import { onDOMContentLoaded } from './utils/on-load-event';

(() => {
  const modules: MakeBilibiliGreatThanEverBeforeModule[] = [
    defuseSpyware,
    enhanceLive,
    fixCopyInCV,
    noAd,
    noP2P,
    noWebRTC,
    optimizeHomepage,
    optimizeStory,
    playerVideoFit,
    removeBlackBackdropFilter,
    removeUselessUrlParams,
    useSystemFonts
  ];

  const styles: string[] = [];
  const onBeforeFetchHooks = new Set<OnBeforeFetchHook>();
  const onResponseHooks = new Set<(response: Response) => Response>();
  const onXhrOpenHooks = new Set<OnXhrOpenHook>();

  const hook: MakeBilibiliGreatThanEverBeforeHook = {
    addStyle(style: string) {
      styles.push(style);
    },
    onBeforeFetch(cb) {
      onBeforeFetchHooks.add(cb);
    },
    onResponse(cb) {
      onResponseHooks.add(cb);
    },
    onXhrOpen(cb) {
      onXhrOpenHooks.add(cb);
    }
  };

  const hostname = unsafeWindow.location.hostname;
  const pathname = unsafeWindow.location.pathname;

  for (const module of modules) {
    module.any?.(hook);
    switch (hostname) {
      case 'www.bilibili.com': {
        if (pathname.startsWith('/read/cv')) {
          module.onCV?.(hook);
        } else if (pathname.startsWith('/video/')) {
          module.onVideo?.(hook);
          module.onVideoOrBangumi?.(hook);
        } else if (pathname.startsWith('/bangumi/play/')) {
          module.onBangumi?.(hook);
          module.onVideoOrBangumi?.(hook);
        }
        break;
      }
      case 'live.bilibili.com': {
        module.onLive?.(hook);
        break;
      }
      case 't.bilibili.com': {
        module.onStory?.(hook);
        break;
      }
      // no default
    }
  }

  // Add Style
  onDOMContentLoaded(() => {
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = styles.join('\n');
    head.appendChild(style);
  });

  // Override fetch
  (($fetch) => {
    unsafeWindow.fetch = function (...$fetchArgs) {
      let abortFetch = false;
      let fetchArgs: typeof $fetchArgs | null | Response = $fetchArgs;
      let mockResponse: Response | null = null;
      for (const obBeforeFetch of onBeforeFetchHooks) {
        try {
          fetchArgs = obBeforeFetch($fetchArgs);
          if (fetchArgs === null) {
            abortFetch = true;
            break;
          } else if (fetchArgs instanceof Response) {
            abortFetch = true;
            mockResponse = fetchArgs;
            break;
          }
        } catch (e) {
          logger.error('Failed to replace fetcherArgs', e, { fetchArgs: $fetchArgs });
        }
      }

      if (abortFetch) {
        logger.info('Fetch aborted', { fetchArgs, mockResponse });

        let resp = mockResponse ?? new Response();
        for (const onResponse of onResponseHooks) {
          resp = onResponse(resp);
        }
        return Promise.resolve(resp);
      }

      return Reflect.apply($fetch, this, $fetchArgs).then((response) => {
        for (const onResponse of onResponseHooks) {
          response = onResponse(response);
        }
        return response;
      });
    };
  })(unsafeWindow.fetch);

  (function (open) {
    unsafeWindow.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...$args: Parameters<XMLHttpRequest['open']>) {
      let xhrArgs: Parameters<XMLHttpRequest['open']> | null = $args;

      for (const onXhrOpen of onXhrOpenHooks) {
        try {
          xhrArgs = onXhrOpen($args, this);
          if (xhrArgs === null) {
            break;
          }
        } catch (e) {
          logger.error('Failed to replace P2P for XMLHttpRequest.prototype.open', e);
        }
      }

      if (xhrArgs === null) {
        logger.info('XHR aborted', { $args });
        this.send = noop;
        this.setRequestHeader = noop;
        return;
      }

      return Reflect.apply(open, this, xhrArgs);
    } as typeof XMLHttpRequest.prototype.open;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with Reflect.apply
  }(unsafeWindow.XMLHttpRequest.prototype.open));
})();
