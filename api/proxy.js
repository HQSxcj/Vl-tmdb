import axios from 'axios';

// 创建缓存对象
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存
const MAX_CACHE_SIZE = 1000;

// 缓存清理函数
function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now > value.expiry) {
            cache.delete(key);
        }
    }
}

// 检查缓存大小
function checkCacheSize() {
    if (cache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].expiry - b[1].expiry);
        const deleteCount = cache.size - MAX_CACHE_SIZE;
        entries.slice(0, deleteCount).forEach(([key]) => cache.delete(key));
    }
}

// 定期清理缓存
setInterval(cleanExpiredCache, CACHE_DURATION);

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { type, path, paths, url } = req.query;

        // 处理图片请求
        if (type === 'image' && path) {
            const cleanPath = path.replace(/^\//, '');
            const imageUrl = `https://image.tmdb.org/t/p/original/${cleanPath}`;
            
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(response.data);
        }

        // 处理批量 TMDB 请求
        if (type === 'tmdb' && paths) {
            const pathArray = Array.isArray(paths) ? paths : [paths];
            const requests = pathArray.map(singlePath => 
                axios.get(`https://api.themoviedb.org/3/${singlePath}`)
            );
            
            const responses = await Promise.all(requests);
            const data = responses.map(response => response.data);
            return res.status(200).json(data);
        }

        // 处理单个 TMDB 请求（带缓存）
        if (type === 'tmdb' && path) {
            const cacheKey = `tmdb:${path}`;
            
            // 检查缓存
            if (cache.has(cacheKey)) {
                const cachedData = cache.get(cacheKey);
                if (Date.now() < cachedData.expiry) {
                    return res.status(200).json(cachedData.data);
                } else {
                    cache.delete(cacheKey);
                }
            }

            // 请求 TMDB API
            const response = await axios.get(`https://api.themoviedb.org/3/${path}`);
            
            // 缓存成功响应
            if (response.status === 200) {
                checkCacheSize();
                cache.set(cacheKey, {
                    data: response.data,
                    expiry: Date.now() + CACHE_DURATION
                });
            }
            
            return res.status(response.status).json(response.data);
        }

        // 通用代理
        if (url) {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Emby-TMDB-Proxy/1.0)'
                }
            });
            
            res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
            return res.status(200).send(response.data);
        }

        // 没有匹配的参数
        return res.status(400).json({ 
            error: 'Missing parameters',
            usage: {
                tmdb_single: '/api/proxy?type=tmdb&path=movie/550',
                tmdb_batch: '/api/proxy?type=tmdb&paths[]=movie/550&paths[]=movie/551',
                image: '/api/proxy?type=image&path=8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
                generic: '/api/proxy?url=https://api.example.com/data'
            }
        });

    } catch (error) {
        console.error('Proxy error:', error.message);
        
        const statusCode = error.response?.status || 500;
        return res.status(statusCode).json({ 
            error: 'Proxy server error',
            message: error.message,
            details: error.response?.data
        });
    }
}