import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { tagged as css } from 'foxts/tagged';

declare global {
  interface Window {
    __INITIAL_STATE__?: {
      elecFullInfo: {
        list?: unknown[]
      },
      adData: Record<string, Array<{ name: string, pic: string, url: string }>>
    }
  }
}

const noAd: MakeBilibiliGreatThanEverBeforeModule = {
  name: 'no-ad',
  description: '防止叔叔通过广告给自己赚棺材钱',
  any({ addStyle }) {
    // 去广告
    addStyle(css`
      .ad-report { display: none !important; }
      a[href*="cm.bilibili.com"] {
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border-width: 0 !important;
      }
    `);

    if (unsafeWindow.__INITIAL_STATE__?.adData) {
      for (const key in unsafeWindow.__INITIAL_STATE__.adData) {
        if (!Array.isArray(unsafeWindow.__INITIAL_STATE__.adData[key])) continue;
        for (const item of unsafeWindow.__INITIAL_STATE__.adData[key]) {
          item.name = 'B 站未来有可能会倒闭，但绝不会变质';
          item.pic = 'https://static.hdslb.com/images/transparent.gif';
          item.url = 'https://space.bilibili.com/208259';
        }
      }
    }
    if (unsafeWindow.__INITIAL_STATE__?.elecFullInfo) {
      unsafeWindow.__INITIAL_STATE__.elecFullInfo.list = [];
    }
  }
};

export default noAd;
