import axios from 'axios';

const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now > value.expiry) {
            cache.delete(key);
        }
    }
}

setInterval(cleanExpiredCache, CACHE_DURATION);

const axiosInstance = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TMDB-Proxy/1.0)'
    }
});

export default async function handler(request, response) {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const { pathname, searchParams } = url;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
            const target = `${API_ORIGIN}${pathname}${url.search}`;
            return await proxyRequest(request, response, target, false);
        }

        if (pathname.startsWith('/t/p/')) {
            const target = `${IMAGE_ORIGIN}${pathname}${url.search}`;
            return await proxyRequest(request, response, target, true);
        }

        const type = searchParams.get('type');
        const path = searchParams.get('path');
        
        if (type === 'tmdb' && path) {
            const target = `${API_ORIGIN}/3/${path}`;
            return await proxyRequest(request, response, target, false);
        }

        if (type === 'image' && path) {
            const cleanPath = path.replace(/^\//, '');
            const target = `${IMAGE_ORIGIN}/t/p/original/${cleanPath}`;
            return await proxyRequest(request, response, target, true);
        }

        return response.status(200).json({
            message: 'TMDB Proxy is running',
            usage: {
                api_direct: '/3/movie/550',
                image_direct: '/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
                api_legacy: '/api/proxy?type=tmdb&path=movie/550',
                image_legacy: '/api/proxy?type=image&path=8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg'
            }
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return response.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

async function proxyRequest(incomingRequest, response, targetUrl, isImage) {
    if (!isImage) {
        const cacheKey = targetUrl;
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (Date.now() < cached.expiry) {
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Cache-Control', 'public, max-age=600');
                return response.status(200).json(cached.data);
            }
            cache.delete(cacheKey);
        }
    }

    try {
        const options = {
            method: incomingRequest.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TMDB-Proxy/1.0)'
            }
        };

        if (isImage) {
            options.responseType = 'arraybuffer';
        }

        const axiosResponse = await axiosInstance.get(targetUrl, options);

        response.setHeader('Access-Control-Allow-Origin', '*');

        if (!isImage && axiosResponse.status === 200) {
            const data = axiosResponse.data;
            
            if (cache.size > 1000) {
                const entries = Array.from(cache.entries());
                entries.sort((a, b) => a[1].expiry - b[1].expiry);
                entries.slice(0, 100).forEach(([key]) => cache.delete(key));
            }
            
            cache.set(targetUrl, {
                data: data,
                expiry: Date.now() + CACHE_DURATION
            });
            
            response.setHeader('Cache-Control', 'public, max-age=600');
            return response.status(200).json(data);
        }

        if (isImage) {
            response.setHeader('Content-Type', axiosResponse.headers['content-type'] || 'image/jpeg');
            response.setHeader('Cache-Control', 'public, max-age=86400');
            return response.status(200).send(axiosResponse.data);
        }

        return response.status(axiosResponse.status).json(axiosResponse.data);

    } catch (error) {
        console.error('Request error:', error.message);
        const status = error.response?.status || 500;
        return response.status(status).json({
            error: 'Proxy server error',
            message: error.message
        });
    }
}