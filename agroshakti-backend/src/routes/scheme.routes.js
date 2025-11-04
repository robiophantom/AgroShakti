const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/', authenticate, isAdmin, schemeController.createScheme);
router.get('/', authenticate, schemeController.getSchemes);
router.get('/search', authenticate, schemeController.searchSchemes);
router.get('/:id', authenticate, schemeController.getSchemeById);
router.put('/:id', authenticate, isAdmin, schemeController.updateScheme);
router.delete('/:id', authenticate, isAdmin, schemeController.deleteScheme);

module.exports = router;