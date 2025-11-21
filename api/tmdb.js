import axios from 'axios';

const tmdbApiKey = 'YOUR_EMBY_TMDB_API_KEY'; // 使用 Emby 插件的 TMDB API key
const tmdbApiUrl = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  try {
    const { endpoint } = req.query;
    const response = await axios.get(`${tmdbApiUrl}/${endpoint}?api_key=${tmdbApiKey}`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching TMDB API');
  }
}
