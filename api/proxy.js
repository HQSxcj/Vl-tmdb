import axios from 'axios';

const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

const axiosInstance = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TMDB-Proxy/1.0)'
    }
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { type, path, url } = req.query;

        if (type === 'tmdb' && path) {
            const targetUrl = `${API_ORIGIN}/3/${path}`;
            const response = await axiosInstance.get(targetUrl);
            return res.status(200).json(response.data);
        }

        if (type === 'image' && path) {
            const cleanPath = path.replace(/^\//, '');
            const targetUrl = `${IMAGE_ORIGIN}/t/p/original/${cleanPath}`;
            const response = await axiosInstance.get(targetUrl, {
                responseType: 'arraybuffer'
            });
            
            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(response.data);
        }

        if (url) {
            const response = await axiosInstance.get(url, {
                responseType: 'arraybuffer'
            });
            res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
            return res.status(200).send(response.data);
        }

        return res.status(400).json({
            error: 'Missing parameters',
            usage: {
                tmdb_api: '/api/proxy?type=tmdb&path=movie/550',
                image: '/api/proxy?type=image&path=8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
                generic: '/api/proxy?url=https://api.example.com/data'
            }
        });

    } catch (error) {
        console.error('Proxy error:', error.message);
        const status = error.response?.status || 500;
        return res.status(status).json({
            error: 'Proxy server error',
            message: error.message
        });
    }
}