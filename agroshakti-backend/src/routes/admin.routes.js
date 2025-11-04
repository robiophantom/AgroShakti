const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/stats', authenticate, isAdmin, adminController.getStats);
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);
router.put('/users/:id/role', authenticate, isAdmin, adminController.changeUserRole);
router.delete('/users/:id', authenticate, isAdmin, adminController.deleteUser);

module.exports = router;