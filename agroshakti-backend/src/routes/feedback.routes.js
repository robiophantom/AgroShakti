const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/', authenticate, feedbackController.submitFeedback);
router.get('/', authenticate, isAdmin, feedbackController.getAllFeedback);

router.post('/reports', authenticate, feedbackController.submitReport);
router.get('/reports', authenticate, isAdmin, feedbackController.getAllReports);
router.put('/reports/:id/resolve', authenticate, isAdmin, feedbackController.resolveReport);

module.exports = router;