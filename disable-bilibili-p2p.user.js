// ==UserScript==
// @name         禁用Bilibili P2P播放
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  强制禁用Bilibili的P2P播放功能
// @author       You
// @match        *://*.bilibili.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('[禁用P2P] 脚本已加载');

    // 方法1: 使用Object.defineProperty拦截全局checkP2PSupport函数
    const hookGlobalFunction = () => {
        if (typeof window.checkP2PSupport !== 'undefined') {
            console.log('[禁用P2P] 已找到全局checkP2PSupport函数，进行拦截');
            const original = window.checkP2PSupport;

            Object.defineProperty(window, 'checkP2PSupport', {
                value: function() {
                    console.log('[禁用P2P] checkP2PSupport被调用，强制返回false');
                    return false;
                },
                writable: false
            });

            console.log('[禁用P2P] 全局函数拦截完成');
        }
    };

    // 方法2: 监听脚本加载并拦截
    const hookScriptLoad = () => {
        const originalCreateElement = document.createElement;

        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);

            if (tagName.toLowerCase() === 'script') {
                const originalSetAttribute = element.setAttribute;

                element.setAttribute = function(name, value) {
                    // 对要加载的脚本进行处理
                    if (name === 'src' && typeof value === 'string' &&
                        (value.includes('room-player') || value.includes('bilibili'))) {
                        const originalOnload = element.onload;

                        element.onload = function() {
                            console.log('[禁用P2P] 检测到相关脚本加载:', value);

                            // 延迟执行以确保函数已定义
                            setTimeout(() => {
                                hookGlobalFunction();
                                hookPrototypes();
                            }, 100);

                            if (originalOnload) originalOnload.apply(this, arguments);
                        };
                    }

                    return originalSetAttribute.call(this, name, value);
                };
            }

            return element;
        };
    };

    // 方法3: 拦截prototype中的方法
    const hookPrototypes = () => {
        // 遍历所有可能包含checkP2PSupport函数的对象
        for (const key in window) {
            try {
                const obj = window[key];
                if (obj && typeof obj === 'object' && obj.prototype) {
                    if (typeof obj.prototype.checkP2PSupport === 'function') {
                        console.log('[禁用P2P] 在原型中找到checkP2PSupport:', key);
                        const original = obj.prototype.checkP2PSupport;

                        obj.prototype.checkP2PSupport = function() {
                            console.log('[禁用P2P] 原型中的checkP2PSupport被调用，强制返回false');
                            return false;
                        };
                    }
                }
            } catch (e) {
                // 忽略访问错误
            }
        }
    };

    // 使用MutationObserver监听DOM变化，以便在动态添加的元素中查找相关函数
    const setupObserver = () => {
        const observer = new MutationObserver((mutations) => {
            hookGlobalFunction();
            hookPrototypes();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    };

    // 执行所有钩子方法
    hookGlobalFunction();
    hookScriptLoad();
    hookPrototypes();

    // DOM加载完成后再次检查和设置观察器
    window.addEventListener('DOMContentLoaded', () => {
        hookGlobalFunction();
        hookPrototypes();
        setupObserver();
    });

    // 初次页面加载完成后再次尝试
    window.addEventListener('load', () => {
        hookGlobalFunction();
        hookPrototypes();
    });
})();