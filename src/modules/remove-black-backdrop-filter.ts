import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';

// 去除叔叔去世时的全站黑白效果
const removeBlackBackdropFilter: MakeBilibiliGreatThanEverBeforeModule = {
  any({ addStyle }) {
    addStyle('html, body { -webkit-filter: none !important; filter: none !important; }');
  }
};

export default removeBlackBackdropFilter;
