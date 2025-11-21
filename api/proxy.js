const axios = require('axios');

// 缓存配置
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;
const WORKER_DOMAIN = 'https://cf.6080808.xyz';

// 缓存清理
function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now > value.expiry) cache.delete(key);
    }
}

// 检查缓存大小
function checkCacheSize() {
    if (cache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].expiry - b[1].expiry);
        const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
        toDelete.forEach(([key]) => cache.delete(key));
    }
}

// 定期清理缓存
setInterval(cleanExpiredCache, CACHE_DURATION);

// 图片代理函数
async function handleImageRequest(req, res) {
    const fullPath = req.url;
    const workerUrl = `${WORKER_DOMAIN}${fullPath}`;
    
    try {
        console.log('Forwarding image to Worker:', workerUrl);
        const response = await fetch(workerUrl, {
            headers: { 'Authorization': req.headers.authorization || '' }
        });
        
        if (response.ok) {
            res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const buffer = await response.arrayBuffer();
            return res.send(Buffer.from(buffer));
        }
        throw new Error(`Worker status: ${response.status}`);
    } catch (error) {
        // 降级：直接代理
        console.log('Fallback to direct image proxy');
        const tmdbImageUrl = `https://image.tmdb.org${fullPath}`;
        try {
            const directResponse = await axios.get(tmdbImageUrl, {
                responseType: 'stream',
                headers: { 'Authorization': req.headers.authorization }
            });
            res.setHeader('Content-Type', directResponse.headers['content-type']);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            directResponse.data.pipe(res);
        } catch (fallbackError) {
            res.status(500).json({ error: 'Image proxy failed' });
        }
    }
}

// API代理函数
async function handleAPIRequest(req, res) {
    const fullPath = req.url;
    const cacheKey = fullPath;
    
    // 检查缓存
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() < cached.expiry) {
            console.log('Cache hit:', fullPath);
            return res.status(200).json(cached.data);
        }
        cache.delete(cacheKey);
    }
    
    // 请求TMDB
    const tmdbUrl = `https://api.themoviedb.org${fullPath}`;
    try {
        const response = await axios.get(tmdbUrl, {
            headers: { 'Authorization': req.headers.authorization }
        });
        
        if (response.status === 200) {
            checkCacheSize();
            cache.set(cacheKey, {
                data: response.data,
                expiry: Date.now() + CACHE_DURATION
            });
            console.log('Cache stored:', fullPath);
        }
        
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data
        });
    }
}

// 主函数
module.exports = async (req, res) => {
    // CORS设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const fullPath = req.url;
    
    try {
        if (fullPath.startsWith('/3/') || fullPath.startsWith('/4/')) {
            return await handleAPIRequest(req, res);
        }
        
        if (fullPath.startsWith('/t/p/')) {
            return await handleImageRequest(req, res);
        }
        
        // 健康检查
        if (fullPath === '/' || fullPath === '/health') {
            return res.json({ status: 'ok', service: 'TMDB Proxy' });
        }
        
        res.status(404).json({ error: 'Path not supported' });
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};