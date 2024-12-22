// 首页广告去除和样式优化
import { addStyle } from '../utils/add-style';

export default function optimizeHomepage() {
  if (location.host === 'www.bilibili.com') {
    addStyle('.feed2 .feed-card:has(a[href*="cm.bilibili.com"]), .feed2 .feed-card:has(.bili-video-card:empty) { display: none } .feed2 .container > * { margin-top: 0 !important }');
  }
}
