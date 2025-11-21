import axios from 'axios';

const tmdbApiKey = 'YOUR_TMDB_API_KEY'; 
const tmdbApiUrl = 'https://api.themoviedb.org/3'; 

export default async function handler(req, res) {
  try {
    const { paths, type } = req.query; 
    const pathArray = Array.isArray(paths) ? paths : [paths]; 

    if (type === 'tmdb') {
      const apiRequests = pathArray.map(path => 
        axios.get(`${tmdbApiUrl}/${path}?api_key=${tmdbApiKey}`, { timeout: 10000 })
      );
      
      const responses = await Promise.all(apiRequests);
      
      const data = responses.map(response => response.data);
      res.status(200).json(data);
    } else if (type === 'image') {
      const imageRequests = pathArray.map(path => 
        axios.get(`https://image.tmdb.org/t/p/w500/${path}`, { responseType: 'arraybuffer', timeout: 10000 })
      );

      const imageResponses = await Promise.all(imageRequests);
      
      const images = imageResponses.map(response => response.data);
      res.status(200).json(images);
    } else {
      res.status(400).send('Invalid request type'); 
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Error processing request');
  }
}