const express = require('express');
const router = express.Router();
const hooksController = require('../controllers/hooks.controller');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/uploadImage');

router.post('/chatbot', authenticate, hooksController.chatbot);
router.post('/soil-analysis', authenticate, hooksController.soilAnalysis);
router.post('/resource-estimation', authenticate, hooksController.resourceEstimation);
router.post('/weather-advisory', authenticate, hooksController.weatherAdvisory);
router.post('/scheme-search', authenticate, hooksController.schemeSearch);
router.post('/disease-detection', authenticate, upload.single('image'), hooksController.diseaseDetection);

module.exports = router;