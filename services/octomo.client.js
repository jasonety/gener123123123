import axios from 'axios';

export async function checkMessageExists(mobileNum, text) {
  if (!process.env.OCTOMO_API_KEY) {
    throw new Error('OCTOMO_API_KEY is not set');
  }

  const url = 'https://api.octoverse.kr/octomo/v1/public/message/exists';
  
  try {
    const response = await axios.post(url, {
      mobileNum,
      text
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Octomo ${process.env.OCTOMO_API_KEY}`
      },
      timeout: 10000
    });
    
    return response.data.exists === true;
  } catch (error) {
    console.error('Octomo API Error:', error.message);
    throw error;
  }
}
