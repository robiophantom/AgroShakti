require('dotenv').config();
const axios = require('axios');

async function testGroqAPI() {
  const apiKey = process.env.GROQ_API_KEY;
  
  console.log('\n🧪 Testing Groq API...\n');
  console.log('API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT FOUND');
  console.log('Key Length:', apiKey ? apiKey.length : 0);
  console.log('');

  if (!apiKey) {
    console.log('❌ ERROR: GROQ_API_KEY not found in .env file\n');
    return;
  }

  try {
    console.log('📡 Sending request to Groq...\n');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Say hello in one sentence'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ SUCCESS! Groq API is working!\n');
    console.log('Response:', response.data.choices[0].message.content);
    console.log('\nModel used:', response.data.model);
    console.log('Tokens used:', response.data.usage);
    console.log('\n🎉 Your API key is valid and working!\n');
    
  } catch (error) {
    console.log('❌ ERROR: Groq API request failed\n');
    
    if (error.response) {
      console.log('Status Code:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n⚠️  DIAGNOSIS: Invalid API Key');
        console.log('   - Your API key might be incorrect or expired');
        console.log('   - Get a new key from: https://console.groq.com/keys');
      } else if (error.response.status === 429) {
        console.log('\n⚠️  DIAGNOSIS: Rate Limit Exceeded');
        console.log('   - Wait a moment and try again');
      } else if (error.response.status === 400) {
        console.log('\n⚠️  DIAGNOSIS: Bad Request');
        console.log('   - Check if your API key has the correct format');
        console.log('   - Make sure there are no extra spaces or quotes');
      }
    } else if (error.request) {
      console.log('❌ No response received from server');
      console.log('   - Check your internet connection');
      console.log('   - The Groq API might be temporarily down');
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\n');
  }
}

testGroqAPI();