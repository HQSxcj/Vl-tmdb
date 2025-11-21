import axios from 'axios';

const tmdbApiKey = 'YOUR_TMDB_API_KEY';  // 使用 TMDB API 密钥
const tmdbApiUrl = 'https://api.themoviedb.org/3';  // TMDB API 基础地址

export default async function handler(req, res) {
  try {
    const { paths, type } = req.query;  // 获取多个路径参数和类型（'tmdb' 或 'image'）
    const pathArray = Array.isArray(paths) ? paths : [paths];  // 确保 paths 是数组

    // 判断是请求 TMDB API 还是图片
    if (type === 'tmdb') {
      const apiRequests = pathArray.map(path => 
        axios.get(`${tmdbApiUrl}/${path}?api_key=${tmdbApiKey}`, { timeout: 10000 })
      );
      
      // 并发请求多个 TMDB API
      const responses = await Promise.all(apiRequests);
      
      // 返回所有请求结果
      const data = responses.map(response => response.data);
      res.status(200).json(data);
    } else if (type === 'image') {
      const imageRequests = pathArray.map(path => 
        axios.get(`https://image.tmdb.org/t/p/w500/${path}`, { responseType: 'arraybuffer', timeout: 10000 })
      );

      // 并发请求多个图片
      const imageResponses = await Promise.all(imageRequests);
      
      // 返回所有图片
      const images = imageResponses.map(response => response.data);
      res.status(200).json(images);
    } else {
      res.status(400).send('Invalid request type');  // 如果类型无效，返回错误
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Error processing request');
  }
}