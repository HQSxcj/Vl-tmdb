import axios from 'axios';
import http from 'http';
import https from 'https';

// 创建 axios 实例优化性能
const axiosInstance = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Emby-TMDB-Proxy/1.0)'
  }
});

// 并发队列类
class ConcurrentQueue {
  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.active = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.execute();
    });
  }

  async execute() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;
    
    this.active++;
    const { requestFn, resolve, reject } = this.queue.shift();
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.active--;
      this.execute();
    }
  }
}

const queue = new ConcurrentQueue(6);

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

    // 如果没有提供任何参数，返回使用说明
    if (!paths && !path && !url) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        usage: {
          batch_tmdb: '/api/proxy?type=tmdb&paths[]=movie/550&paths[]=movie/551',
          batch_image: '/api/proxy?type=image&paths[]=abc123.jpg&paths[]=def456.jpg',
          single_tmdb: '/api/proxy?type=tmdb&path=movie/550',
          single_image: '/api/proxy?type=image&path=w500/abc123.jpg',
          generic_proxy: '/api/proxy?url=https://api.example.com/data'
        }
      });
    }

    // 批量请求处理
    if (paths) {
      const pathArray = Array.isArray(paths) ? paths : [paths];

      if (type === 'tmdb') {
        const apiRequests = pathArray.map(singlePath => 
          queue.add(() => 
            axiosInstance.get(`https://api.themoviedb.org/3/${singlePath}`)
              .then(response => response.data)
              .catch(error => ({
                error: `Failed to fetch ${singlePath}`,
                status: error.response?.status || 500,
                message: error.message
              }))
          )
        );
        
        const results = await Promise.all(apiRequests);
        return res.status(200).json(results);
        
      } else if (type === 'image') {
        const imageUrls = pathArray.map(singlePath => 
          `https://image.tmdb.org/t/p/original/${singlePath}`
        );
        return res.status(200).json(imageUrls);
      }
      
      return res.status(400).json({ error: 'Invalid request type for batch processing' });
    }

    // 单个请求处理
    if (type === 'tmdb' && path) {
      const response = await axiosInstance.get(`https://api.themoviedb.org/3/${path}`);
      return res.status(200).json(response.data);
    } 
    else if (type === 'image' && path) {
      return res.redirect(302, `https://image.tmdb.org/t/p/original/${path}`);
    }
    else if (url) {
      const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      return res.status(200).send(response.data);
    }
    else {
      return res.status(400).json({ 
        error: 'Invalid parameters',
        message: 'Missing required parameters: type and path/url'
      });
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // 修复这里的错误处理
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