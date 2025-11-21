import axios from 'axios';

const embyApiUrl = 'http://your-emby-server/api'; // 替换为你的 Emby 服务器地址
const embyApiKey = 'YOUR_EMBY_TMDB_API_KEY';     // 替换为 Emby TMDB 插件 API key

export default async function handler(req, res) {
  try {
    const { endpoint } = req.query;
    const response = await axios.get(`${embyApiUrl}/${endpoint}`, {
      headers: { 'X-Emby-Token': embyApiKey },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching Emby API');
  }
}
