// ==UserScript==
// @name         B站直播真原画
// @namespace    https://github.com/ipcjs/bilibili-helper
// @version      0.1.0
// @description  解除B站直播画质限制，获取真原画质量的直播流
// @author       Your Name
// @match        https://live.bilibili.com/*
// @match        https://live.bilibili.com/blanc/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      bilivideo.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 简易日志系统
    const logger = {
        log: console.log.bind(console, '[bilibili-true-origin-live]'),
        error: console.error.bind(console, '[bilibili-true-origin-live]'),
        warn: console.warn.bind(console, '[bilibili-true-origin-live]'),
        info: console.info.bind(console, '[bilibili-true-origin-live]'),
        debug: console.debug.bind(console, '[bilibili-true-origin-live]')
    };

    // 简易LRU缓存实现
    function createLRUCache(maxSize) {
        const cache = new Map();
        const keys = [];

        return {
            get(key) {
                return cache.get(key);
            },
            set(key, value) {
                if (keys.length >= maxSize) {
                    const oldestKey = keys.shift();
                    cache.delete(oldestKey);
                }
                if (!cache.has(key)) {
                    keys.push(key);
                }
                cache.set(key, value);
                return value;
            },
            has(key) {
                return cache.has(key);
            }
        };
    }

    // 简易关键词过滤器
    function createKeywordFilter(keywords) {
        return (str) => {
            if (!str) return false;
            for (const keyword of keywords) {
                if (str.includes(keyword)) return true;
            }
            return false;
        };
    }

    // CDN主机映射
    const cdnHostMap = {
        Bili: 'd0--cn-gotcha01.bilivideo.com',
        Tencent: 'd1--cn-gotcha204.bilivideo.com',
        Baidu: 'd1--cn-gotcha207.bilivideo.com',
        Huawei: 'd1--cn-gotcha208.bilivideo.com',
        Aliyun: 'd1--cn-gotcha209.bilivideo.com'
    };

    // CDN主机匹配正则
    const cdnHostPattern = {
        Any: /[cd][01n]-[\da-z-]+\.bilivideo\.com/,
        Bili: /cn(?:-[a-z]+){2}(?:-\d+){2}/,
        Tencent: /gotcha204(?:b|-[1-4])?\./,
        Baidu: /gotcha207b?\./,
        Huawei: /gotcha208b?\./,
        Aliyun: /gotcha209b?\./
    };

    // HLS文件过滤器
    const hlsFilter = createKeywordFilter(['.m3u8', '.m4s']);

    // 构建流URL
    function buildStreamUrl(host, streamName, requestFile) {
        let path = '';
        if (cdnHostPattern.Bili.test(host) || cdnHostPattern.Tencent.test(host)) {
            path = `/live-bvc/${streamName}/${requestFile}`;
        } else {
            path = `/live-bvc/000000/${streamName}/${requestFile}`;
        }
        return `https://${host}${path}`;
    }

    // 获取当前房间ID
    function getRoomId() {
        return /live\.bilibili\.com\/(?:blanc\/)?(\d+)/.exec(location.href)?.[1];
    }

    // 获取原始流名称
    function getOriginStreamName(url) {
        const streamName = /\/live-bvc\/\d+\/(live_[^./]+)/.exec(url)?.[1];
        const suffix = /suffix=([^&]+)/.exec(url)?.[1];
        let originStreamName = streamName;
        if (suffix && suffix !== 'origin') {
            originStreamName = originStreamName?.replace(`_${suffix}`, '');
        }
        return originStreamName;
    }

    // 获取请求的文件名
    function getRequestFile(url) {
        const urlParts = url.split('/');
        return urlParts[urlParts.length - 1].split('?')[0];
    }

    // 从请求中获取URL
    function getUrlFromRequest(request) {
        if (typeof request === 'string') {
            return request;
        }
        if (request instanceof URL || (request && typeof request === 'object' && 'href' in request)) {
            return request.href;
        }
        if (request && typeof request === 'object' && 'url' in request) {
            return request.url;
        }
        logger.error('无效的请求信息', request);
        return null;
    }

    // 创建缓存存储
    const streamNameCache = createLRUCache(300);

    // 重写fetch方法以拦截请求
    const originalFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = async function(requestInfo, requestInit) {
        try {
            const url = getUrlFromRequest(requestInfo);
            if (url == null) {
                return originalFetch.apply(this, arguments);
            }

            const urlString = String(url);

            // 获取当前直播间ID
            const roomId = getRoomId();
            if (!roomId) return originalFetch.apply(this, arguments);

            // 修改 getRoomPlayInfo 请求
            if (urlString.includes('/xlive/web-room/v2/index/getRoomPlayInfo')) {
                // 不请求 HLS-TS
                const newUrl = urlString
                    .replace('&protocol=0,1', '&protocol=0,1')
                    .replace('&format=0,1,2', '&format=0,2');

                requestInfo = newUrl;
            }

            // 仅处理 hls
            if (!hlsFilter(urlString)) return originalFetch.apply(this, arguments);

            // 获取直播流 CDN
            const cdnMatch = cdnHostPattern.Any.exec(urlString);
            if (!cdnMatch) return originalFetch.apply(this, arguments);
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
            if (!originStreamName) return originalFetch.apply(this, arguments);

            // 缓存原始流名称
            if (!streamNameCache.has(roomId)) {
                streamNameCache.set(roomId, originStreamName);
                logger.info('缓存流名称:', originStreamName);
            }

            // 提取请求文件
            const requestFile = getRequestFile(urlString);

            // 构建新 URL
            if (streamNameCache.has(roomId)) {
                const host = /^\D/.test(requestFile) ? cdnHostMap.Bili : cdnHost;
                const newUrl = buildStreamUrl(host, streamNameCache.get(roomId), requestFile);
                logger.info('使用缓存的流:', newUrl);
                requestInfo = newUrl;
            }

            // 执行请求
            const response = await originalFetch.call(this, requestInfo, requestInit);

            // 处理404等错误，尝试使用备用节点
            if (hlsFilter(response.url) && !response.ok) {
                logger.error('直播真原画请求失败', response.url, response.status);

                try {
                    if (!roomId) return response;
                    if (!streamNameCache.has(roomId)) return response;

                    const streamName = streamNameCache.get(roomId);
                    const requestFile = getRequestFile(response.url);

                    // 尝试使用CN01节点重试
                    const retryUrl = buildStreamUrl(cdnHostMap.Bili, streamName, requestFile);
                    logger.warn('重试使用CN01节点', retryUrl);
                    return originalFetch.call(this, retryUrl, requestInit);
                } catch (e) {
                    logger.error('重试请求时出错', e);
                }
            }

            return response;
        } catch (e) {
            logger.error('处理直播真原画时出错', e);
            return originalFetch.apply(this, arguments);
        }
    };

    logger.info('B站直播真原画脚本已加载');
})();