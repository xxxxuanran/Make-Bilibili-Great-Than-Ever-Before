// 去除鸿蒙字体，强制使用系统默认字体
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { addStyle } from '../utils/add-style';

export default function useSystemFonts(): MakeBilibiliGreatThanEverBeforeModule {
  document.querySelectorAll(String.raw`link[href*=\/font\/]`).forEach(x => x.remove());
  addStyle('html, body { font-family: initial !important; }');

  return {};
}
