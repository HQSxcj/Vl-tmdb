import axios from 'axios';
import http from 'http';
import https from 'https';

const axiosInstance = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Emby-TMDB-Proxy/1.0)'
  }
});

// 移除 ConcurrentQueue 类以简化

export default async function handler(req, res) {
  try {
    const { paths, path, url, type } = req.query;

    // CORS 设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (!paths && !path && !url) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        usage: {
          single_tmdb: '/api/proxy?type=tmdb&path=movie/550',
          single_image: '/api/proxy?type=image&path=8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
          search: '/api/proxy?type=tmdb&path=search/movie?query=Avengers'
        }
      });
    }

    // 单个请求处理
    if (type === 'tmdb' && path) {
      const response = await axiosInstance.get(`https://api.themoviedb.org/3/${path}`, {
        params: { 
          api_key: process.env.TMDB_API_KEY,
          ...req.query // 包含其他查询参数
        }
      });
      return res.status(200).json(response.data);
    } 
    else if (type === 'image' && path) {
      // 直接代理图片数据，而不是重定向
      const cleanPath = path.replace(/^\//, '');
      const imageUrl = `https://image.tmdb.org/t/p/original/${cleanPath}`;
      
      console.log('Fetching image from:', imageUrl);
      
      const response = await axiosInstance.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      // 设置正确的图片 Content-Type
      const contentType = response.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存24小时
      
      return res.status(200).send(response.data);
    }
    else if (url) {
      const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      return res.status(200).send(response.data);
    }
    else {
      return res.status(400).json({ 
        error: 'Invalid parameters'
      });
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    let statusCode = 500;
    if (error.response && error.response.status) {
      statusCode = error.response.status;
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 504;
    }
    
    return res.status(statusCode).json({ 
      error: 'Proxy server error',
      message: error.message
    });
  }
}