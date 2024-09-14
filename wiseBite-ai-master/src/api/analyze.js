
import axios from 'axios';

async function analyzeProduct(url) {
  try {
    const response = await axios.post('http://localhost:3000/api/analyze', { url });
    return response.data.analysis;
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw new Error('Failed to analyze product. Please try again.');
  }
}

export default analyzeProduct;