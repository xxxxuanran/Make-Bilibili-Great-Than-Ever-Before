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
import type { MakeBilibiliGreatThanEverBeforeHook, MakeBilibiliGreatThanEverBeforeModule } from './types';

(() => {
  const modules: MakeBilibiliGreatThanEverBeforeModule[] = [
    defuseSpyware(),
    enhanceLive(),
    fixCopyInCV(),
    noAd(),
    noP2P(),
    noWebRTC(),
    optimizeHomepage(),
    optimizeStory(),
    playerVideoFit(),
    removeBlackBackdropFilter(),
    removeUselessUrlParams(),
    useSystemFonts()
  ];

  const styles: string[] = [];

  const hook: MakeBilibiliGreatThanEverBeforeHook = {
    addStyle(style: string) {
      styles.push(style);
    }
  };

  const hostname = unsafeWindow.location.hostname;
  const pathname = unsafeWindow.location.pathname;

  for (const module of modules) {
    module.any?.(hook);
    switch (hostname) {
      case 'www.bilibili.com': {
        module.onWww?.(hook);
        if (pathname.startsWith('/read/cv')) {
          module.onCV?.(hook);
        } else if (pathname.startsWith('/video/')) {
          module.onVideo?.(hook);
        } else if (pathname.startsWith('/bangumi/play/')) {
          module.onBangumi?.(hook);
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
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = styles.join('\n');
  head.appendChild(style);
})();
