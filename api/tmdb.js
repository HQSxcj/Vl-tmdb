import axios from 'axios';

// 创建 axios 实例优化性能
const axiosInstance = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  // 保持连接复用，提高并发性能
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Emby-TMDB-Proxy/1.0)'
  }
});

// 限制并发数，避免过多请求被限制
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

const queue = new ConcurrentQueue(6); // 限制最大6个并发

export default async function handler(req, res) {
  try {
    const { paths, path, url, type } = req.query;

    // CORS 设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

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
        res.status(200).json(results);
        
      } else if (type === 'image') {
        // 图片直接返回 URL，让 Emby 自己处理并发下载
        const imageUrls = pathArray.map(singlePath => 
          `https://image.tmdb.org/t/p/original/${singlePath}`
        );
        res.status(200).json(imageUrls);
      }
      return;
    }

    // 单个请求处理
    if (type === 'tmdb' && path) {
      const response = await axiosInstance.get(`https://api.themoviedb.org/3/${path}`);
      res.status(200).json(response.data);
    } 
    else if (type === 'image' && path) {
      // 图片重定向，减少服务器负载
      res.redirect(302, `https://image.tmdb.org/t/p/original/${path}`);
    }
    else if (url) {
      const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
      // 设置正确的 headers
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      res.status(200).send(response.data);
    }
    else {
      res.status(400).json({ error: 'Invalid parameters' });
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Proxy server error',
      message: error.message
    });
  }
}