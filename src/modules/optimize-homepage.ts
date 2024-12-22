// 首页广告去除和样式优化
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';

export default function optimizeHomepage(): MakeBilibiliGreatThanEverBeforeModule {
  return {
    onWww({ addStyle }) {
      addStyle('.feed2 .feed-card:has(a[href*="cm.bilibili.com"]), .feed2 .feed-card:has(.bili-video-card:empty) { display: none } .feed2 .container > * { margin-top: 0 !important }');
    }
  };
}
