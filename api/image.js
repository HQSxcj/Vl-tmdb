import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { path } = req.query;
    const imageUrl = `https://image.tmdb.org/t/p/w500/${path}`;
    
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching image');
  }
}
