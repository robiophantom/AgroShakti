const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/survey.controller');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../middleware/uploadImage');

router.post('/', authenticate, isAdmin, surveyController.createSurvey);
router.get('/active', authenticate, surveyController.getActiveSurvey);
router.get('/', authenticate, isAdmin, surveyController.getAllSurveys);
router.post('/:id/respond', authenticate, upload.single('image'), surveyController.submitResponse);
router.get('/:id/responses', authenticate, isAdmin, surveyController.getSurveyResponses);

module.exports = router;