const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinaryConnection() {
  console.log('🧪 Testing Cloudinary Connection...\n');

  // Display configuration (hide secret)
  console.log('📋 Configuration:');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY);
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
  console.log('Folder:', process.env.CLOUDINARY_FOLDER || 'agroshakti');
  console.log('');

  // Check if credentials are set
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME is not set in .env file');
    process.exit(1);
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    console.error('❌ CLOUDINARY_API_KEY is not set in .env file');
    process.exit(1);
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ CLOUDINARY_API_SECRET is not set in .env file');
    process.exit(1);
  }

  try {
    console.log('🔌 Attempting to connect to Cloudinary...\n');

    // Test 1: Ping API
    console.log('Test 1: Pinging Cloudinary API...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Ping successful!');
    console.log('   Status:', pingResult.status);
    console.log('');

    // Test 2: Get usage stats
    console.log('Test 2: Getting account usage...');
    const usage = await cloudinary.api.usage();
    console.log('✅ Usage retrieved successfully!');
    console.log('   Plan:', usage.plan);
    console.log('   Credits Used:', usage.credits.usage);
    console.log('   Credits Limit:', usage.credits.limit);
    console.log('   Storage Used:', (usage.storage.usage / 1024 / 1024).toFixed(2), 'MB');
    console.log('   Bandwidth Used:', (usage.bandwidth.usage / 1024 / 1024).toFixed(2), 'MB');
    console.log('   Transformations:', usage.transformations.usage);
    console.log('');

    // Test 3: List folders
    console.log('Test 3: Listing folders...');
    try {
      const folders = await cloudinary.api.root_folders();
      console.log('✅ Folders retrieved!');
      if (folders.folders && folders.folders.length > 0) {
        console.log('   Existing folders:', folders.folders.map(f => f.name).join(', '));
      } else {
        console.log('   No folders found (this is normal for new accounts)');
      }
    } catch (err) {
      console.log('⚠️  Could not list folders (this is okay)');
    }
    console.log('');

    // Test 4: Check if main folder exists
    console.log('Test 4: Checking main folder...');
    const folderName = process.env.CLOUDINARY_FOLDER || 'agroshakti';
    try {
      const folderCheck = await cloudinary.api.sub_folders(folderName);
      console.log(`✅ Folder '${folderName}' exists!`);
      if (folderCheck.folders && folderCheck.folders.length > 0) {
        console.log('   Subfolders:', folderCheck.folders.map(f => f.name).join(', '));
      }
    } catch (err) {
      console.log(`⚠️  Folder '${folderName}' doesn't exist yet (will be created on first upload)`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Cloudinary Connection Successful!');
    console.log('═══════════════════════════════════════');
    console.log('✅ API credentials are valid');
    console.log('✅ Account is active');
    console.log('✅ Ready to upload images');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your backend: npm run dev');
    console.log('2. Test image upload via API');
    console.log('3. Check Media Library: https://cloudinary.com/console/media_library');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ Cloudinary Connection Failed!');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.error && error.error.http_code === 401) {
      console.error('⚠️  Authentication Error (401)');
      console.error('   Possible causes:');
      console.error('   1. Invalid API Key or API Secret');
      console.error('   2. Incorrect Cloud Name');
      console.error('   3. Credentials mismatch');
      console.error('');
      console.error('   Solution:');
      console.error('   1. Go to: https://cloudinary.com/console');
      console.error('   2. Check your credentials in Dashboard');
      console.error('   3. Copy them again to .env file');
    } else if (error.error && error.error.http_code === 404) {
      console.error('⚠️  Resource Not Found (404)');
      console.error('   Check your Cloud Name is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.error('⚠️  Network Error');
      console.error('   Check your internet connection');
    } else {
      console.error('Full error details:', error);
    }
    
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify .env file has all Cloudinary variables');
    console.error('2. No quotes around values in .env');
    console.error('3. No extra spaces');
    console.error('4. Restart server after changing .env');
    console.error('');
    
    process.exit(1);
  }
}

testCloudinaryConnection();