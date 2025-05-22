import { logger } from '../logger';
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { getUrlFromRequest } from '../utils/get-url-from-request';
import flru from 'flru';
import { createRetrieKeywordFilter } from 'foxts/retrie';

// 正则表达式匹配

const cdnHostMap = {
  Bili: 'd0--cn-gotcha01.bilivideo.com',
  Tencent: 'd1--cn-gotcha204.bilivideo.com',
  Baidu: 'd1--cn-gotcha207.bilivideo.com',
  Huawei: 'd1--cn-gotcha208.bilivideo.com',
  Aliyun: 'd1--cn-gotcha209.bilivideo.com'
};

const cdnHostPattern = {
  Any: /[cd][01n]-[\da-z-]+\.bilivideo\.com/,
  Bili: /cn(?:-[a-z]+){2}(?:-\d+){2}/,
  Tencent: /gotcha204(?:b|-[1-4])?\./,
  Baidu: /gotcha207b?\./,
  Huawei: /gotcha208b?\./,
  Aliyun: /gotcha209b?\./
};

const hlsFilter = createRetrieKeywordFilter([
  '.m3u8',
  '.m4s'
]);

function buildStreamUrl(host: string, streamName: string, requestFile: string) {
  let path = '';
  if (cdnHostPattern.Bili.test(host) || cdnHostPattern.Tencent.test(host)) {
    path = `/live-bvc/${streamName}/${requestFile}`;
  } else {
    path = `/live-bvc/000000/${streamName}/${requestFile}`;
  }
  return `https://${host}${path}`;
}

function getRoomId() {
  return /live\.bilibili\.com\/(?:blanc\/)?(\d+)/.exec(location.href)?.[1];
}

function getOriginStreamName(url: string) {
  const streamName = /\/live-bvc\/\d+\/(live_[^./]+)/.exec(url)?.[1];
  const suffix = /suffix=([^&]+)/.exec(url)?.[1];
  let originStreamName = streamName;
  if (suffix && suffix !== 'origin') {
    originStreamName = originStreamName?.replace(`_${suffix}`, '');
  }
  return originStreamName;
}

function getRequestFile(url: string) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1].split('?')[0];
}

const trueOriginLive: MakeBilibiliGreatThanEverBeforeModule = {
  name: 'true-origin-live',
  description: '直播真原画',

  onLive({ onBeforeFetch, onResponse }) {
    // 创建缓存存储
    const streamNameCache = flru<string>(300);

    onBeforeFetch((fetchArgs) => {
      try {
        const url = getUrlFromRequest(fetchArgs[0]);
        if (url == null) {
          return fetchArgs;
        }

        const urlString = String(url);

        // 获取当前直播间ID
        const roomId = getRoomId();
        if (!roomId) return fetchArgs;

        // 修改 getRoomPlayInfo 请求
        if (urlString.includes('/xlive/web-room/v2/index/getRoomPlayInfo')) {
          // 不请求 HLS-TS
          const newUrl = urlString
            .replace('&protocol=0,1', '&protocol=0,1')
            .replace('&format=0,1,2', '&format=0,2');

          fetchArgs[0] = newUrl;
          return fetchArgs;
        }

        // 仅处理 hls
        if (!hlsFilter(urlString)) return fetchArgs;

        // 获取直播流 CDN
        const cdnMatch = cdnHostPattern.Any.exec(urlString);
        if (!cdnMatch) return fetchArgs;
        let cdnHost = cdnMatch[0]
          .replace('ov-gotcha20', 'cn-gotcha20') // ov2cn
          .replaceAll(/(?:c1|c0|d0|d1)--cn-gotcha20(\d)b?/g, 'd1--cn-gotcha20$1'); // force d1 main

        // 更新内置 CN01 节点
        if (cdnHostPattern.Bili.test(cdnHost)) cdnHostMap.Bili = cdnHost;

        // Aliyun 可能为二次转推，延迟多约 2s
        // Tencent 晚高峰卡顿严重
        if (cdnHostPattern.Aliyun.test(cdnHost) || cdnHostPattern.Tencent.test(cdnHost)) {
          cdnHost = Math.random() > 0.5 ? cdnHostMap.Baidu : cdnHostMap.Huawei;
        }

        // 获取 stream_name
        const originStreamName = getOriginStreamName(urlString);
        if (!originStreamName) return fetchArgs;

        // 缓存原始流名称
        if (!streamNameCache.has(roomId)) {
          streamNameCache.set(roomId, originStreamName);
          logger.info('Caching stream name :', originStreamName);
        }

        // 提取请求文件
        const requestFile = getRequestFile(urlString);

        // 构建新 URL
        if (streamNameCache.has(roomId)) {
          const host = /^\D/.test(requestFile) ? cdnHostMap.Bili : cdnHost;
          const newUrl = buildStreamUrl(host, streamNameCache.get(roomId)!, requestFile);
          logger.info('Using cached stream :', newUrl);
          fetchArgs[0] = newUrl;
          return fetchArgs;
        }

        return fetchArgs;
      } catch (e) {
        logger.error('处理直播真原画时出错', e);
        return fetchArgs;
      }
    });

    // 处理404等错误，尝试使用备用节点
    onResponse((resp, fetchArgs, $fetch) => {
      if (hlsFilter(resp.url) && !resp.ok) {
        logger.error('直播真原画请求失败', resp.url, resp.status);

        try {
          const roomId = getRoomId();
          if (!roomId) return resp;
          if (!streamNameCache.has(roomId)) return resp;

          const streamName = streamNameCache.get(roomId)!;
          const requestFile = getRequestFile(resp.url);

          // 尝试使用CN01节点重试
          const retryUrl = buildStreamUrl(cdnHostMap.Bili, streamName, requestFile);
          logger.warn('重试使用CN01节点', retryUrl);
          return $fetch(retryUrl, fetchArgs[1]);
        } catch (e) {
          logger.error('重试请求时出错', e);
        }
      }
      return resp;
    });
  }
};

export default trueOriginLive;
