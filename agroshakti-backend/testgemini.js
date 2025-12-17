require('dotenv').config();
const axios = require('axios');

async function listAvailableModels(apiKey) {
  try {
    console.log('📋 Fetching available models...\n');
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    const models = response.data.models.filter(model => 
      model.supportedGenerationMethods.includes('generateContent')
    );
    
    console.log('✅ Available models for generateContent:');
    models.forEach(model => {
      console.log(`   - ${model.name.replace('models/', '')}`);
    });
    console.log('');
    
    return models[0].name.replace('models/', ''); // Return first available model
  } catch (error) {
    console.log('❌ Could not fetch models list\n');
    return null;
  }
}

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('\n🧪 Testing Gemini API...\n');
  console.log('API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT FOUND');
  console.log('Key Length:', apiKey ? apiKey.length : 0);
  console.log('');

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ ERROR: GEMINI_API_KEY not configured in .env file\n');
    console.log('Get your key from: https://aistudio.google.com/app/apikey\n');
    return;
  }

  // First, get the correct model name
  const modelName = await listAvailableModels(apiKey);
  
  if (!modelName) {
    console.log('⚠️  Trying with default model name...\n');
  }

  // Try different model name formats
  const modelsToTry = [
    modelName,
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest', 
    'gemini-pro',
    'gemini-1.0-pro'
  ].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      console.log(`📡 Testing with model: ${model}...\n`);
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Say hello in one sentence'
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ SUCCESS! Gemini API is working!\n');
      console.log('Response:', response.data.candidates[0].content.parts[0].text);
      console.log(`\n✨ Working Model: ${model}`);
      console.log('\n🎉 Your Gemini API key is valid and working!\n');
      
      // Show how to use this in your code
      console.log('💡 Use this model name in your code:');
      console.log(`   const MODEL_NAME = '${model}';`);
      console.log(`   const url = \`https://generativelanguage.googleapis.com/v1/models/\${MODEL_NAME}:generateContent?key=\${apiKey}\`;\n`);
      
      return; // Exit on success
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ Model '${model}' not found, trying next...\n`);
        continue;
      }
      
      // Other errors - show details
      console.log(`❌ ERROR with model '${model}':\n`);
      
      if (error.response) {
        console.log('Status Code:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 400) {
          const errorMsg = JSON.stringify(error.response.data);
          if (errorMsg.includes('API_KEY_INVALID')) {
            console.log('\n⚠️  DIAGNOSIS: Invalid API Key');
            console.log('   - Your API key format is incorrect');
            console.log('   - Get a new key from: https://aistudio.google.com/app/apikey');
          } else if (errorMsg.includes('API key not valid')) {
            console.log('\n⚠️  DIAGNOSIS: API Key Not Valid');
            console.log('   - The API key might be expired or deleted');
            console.log('   - Create a new key from: https://aistudio.google.com/app/apikey');
          }
          return; // Stop on auth errors
        } else if (error.response.status === 429) {
          console.log('\n⚠️  DIAGNOSIS: Rate Limit Exceeded');
          console.log('   - Free tier limit: 60 requests per minute');
          console.log('   - Wait a moment and try again');
          return;
        } else if (error.response.status === 403) {
          console.log('\n⚠️  DIAGNOSIS: API Not Enabled or Access Denied');
          console.log('   - Make sure Generative Language API is enabled');
          console.log('   - Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
          return;
        }
      } else if (error.request) {
        console.log('❌ No response received from server');
        console.log('   - Check your internet connection');
        return;
      } else {
        console.log('Error:', error.message);
        return;
      }
      
      console.log('');
    }
  }
  
  console.log('❌ All model attempts failed. Please check:');
  console.log('   1. Your API key is valid: https://aistudio.google.com/app/apikey');
  console.log('   2. Generative AI API is enabled in Google Cloud Console');
  console.log('   3. Your API key has proper permissions\n');
}

testGeminiAPI();