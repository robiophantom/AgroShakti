const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const authenticate = require('../middleware/auth');

router.get('/chat', authenticate, historyController.getChatHistory);
router.get('/disease', authenticate, historyController.getDiseaseHistory);
router.get('/soil', authenticate, historyController.getSoilHistory);
router.get('/weather', authenticate, historyController.getWeatherHistory);
router.get('/resource', authenticate, historyController.getResourceHistory);

module.exports = router;