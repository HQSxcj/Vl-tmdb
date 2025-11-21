import axios from 'axios';

const embyApiUrl = 'https://k.6080808.xyz:16666'; // CF 隧道公网地址
const embyApiKey = 'YOUR_EMBY_TMDB_API_KEY'; // Emby TMDB 插件 API Key

export default async function handler(req, res) {
  try {
    // 获取路径参数，例如 /api/emby/movies/550 => endpoint = ['movies','550']
    const { endpoint } = req.query;
    const path = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    const response = await axios.get(`${embyApiUrl}/${path}`, {
      headers: {
        'X-Emby-Token': embyApiKey,
        'User-Agent': 'Mozilla/5.0',
        'Host': '7.6080808.xyz'
      },
      timeout: 10000
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Emby API Error:', error.message);
    res.status(500).send('Error fetching Emby API');
  }
}