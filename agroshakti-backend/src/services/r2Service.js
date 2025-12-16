const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

class CloudinaryService {
  
  /**
   * Upload image to Cloudinary from buffer
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {string} folder - Folder path in Cloudinary (e.g., 'surveys', 'diseases')
   * @returns {Promise<Object>} - Upload result with url and public_id
   */
  async uploadImage(fileBuffer, folder = 'agroshakti') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${process.env.CLOUDINARY_FOLDER || 'agroshakti'}/${folder}`,
          resource_type: 'image',
          format: 'jpg', // Auto-convert to jpg
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' }, // Max dimensions
            { quality: 'auto' } // Auto quality optimization
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(new Error('Failed to upload image to Cloudinary'));
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              size: result.bytes
            });
          }
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Upload image from file path (for Flask service integration)
   * @param {string} filePath - Local file path
   * @param {string} folder - Folder path in Cloudinary
   * @returns {Promise<Object>} - Upload result
   */
  async uploadImageFromPath(filePath, folder = 'agroshakti') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `${process.env.CLOUDINARY_FOLDER || 'agroshakti'}/${folder}`,
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public_id
   * @returns {Promise<boolean>}
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary Delete Error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {string} url - Full Cloudinary URL
   * @returns {string} - public_id
   */
  extractPublicId(url) {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/agroshakti/surveys/image.jpg
    // Returns: agroshakti/surveys/image
    const matches = url.match(/\/([^\/]+\/[^\/]+\/[^\/\.]+)/);
    return matches ? matches[1] : null;
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - Cloudinary public_id
   * @param {Object} options - Transformation options
   * @returns {string} - Transformed image URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 800,
      height = 800,
      quality = 'auto',
      format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'limit' },
        { quality, fetch_format: format }
      ],
      secure: true
    });
  }

  /**
   * Get thumbnail URL
   * @param {string} publicId - Cloudinary public_id
   * @param {number} size - Thumbnail size (default 150)
   * @returns {string} - Thumbnail URL
   */
  getThumbnailUrl(publicId, size = 150) {
    return cloudinary.url(publicId, {
      transformation: [
        { width: size, height: size, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      secure: true
    });
  }
}

module.exports = new CloudinaryService();