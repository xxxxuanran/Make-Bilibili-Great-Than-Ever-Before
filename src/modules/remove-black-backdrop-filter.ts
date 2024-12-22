import { addStyle } from '../utils/add-style';

// 去除叔叔去世时的全站黑白效果
export default function removeBlackBackdropFilter() {
  addStyle('html, body { -webkit-filter: none !important; filter: none !important; }');
}
