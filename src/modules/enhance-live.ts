import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { ErrorCounter } from '../utils/error-counter';
import { getUrlFromRequest } from '../utils/get-url-from-request';
import { tagged as css } from 'foxts/tagged';

declare global {
  interface Window {
    disableMcdn?: boolean
  }
}

// const mcdnRegexp = /[\dxy]+\.mcdn\.bilivideo\.cn:\d+/;
const qualityRegexp = /(live-bvc\/\d+\/live_\d+_\d+)_\w+/;

const enhanceLive: MakeBilibiliGreatThanEverBeforeModule = {
  name: 'enhance-live',
  description: '增强直播（原画画质、其他修复）',
  onLive({ addStyle, onBeforeFetch, onResponse }) {
    let forceHighestQuality = true;

    // 还得帮叔叔修 bug，唉
    addStyle(css`div[data-cy=EvaRenderer_LayerWrapper]:has(.player) { z-index: 999999; }`);

    // 干掉些直播间没用的东西
    addStyle(css`#welcome-area-bottom-vm, .web-player-icon-roomStatus { display: none !important; }`);

    // 修复直播画质
    onBeforeFetch((fetchArgs) => {
      if (!forceHighestQuality) {
        return fetchArgs;
      }

      try {
        const url = getUrlFromRequest(fetchArgs[0]);
        if (url == null) {
          return fetchArgs;
        }
        // if (mcdnRegexp.test(url) && disableMcdn) {
        //   return Promise.reject();
        // }
        if (qualityRegexp.test(url)) {
          fetchArgs[0] = url
            .replace(qualityRegexp, '$1')
            .replaceAll(/(\d+)_(?:mini|pro)hevc/g, '$1');
        }

        return fetchArgs;
      } catch {
        return fetchArgs;
      }
    });

    const errorCounter = new ErrorCounter(1000 * 30);

    onResponse((response) => {
      if (response.url.endsWith('.m3u8') || response.url.endsWith('.m4s')) {
        if (!response.ok) {
          errorCounter.recordError();
        }
        if (forceHighestQuality && errorCounter.getErrorCount() >= 5) {
          forceHighestQuality = false;
          GM.notification(
            '[Make Bilibili Great Then Ever Before] 已为您自动切换至播放器上选择的清晰度.',
            '最高清晰度可能不可用'
          );
        }
      }
      return response;
    });
  }
};

export default enhanceLive;
