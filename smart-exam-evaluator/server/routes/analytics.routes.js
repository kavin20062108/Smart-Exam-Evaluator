const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
    getExamAnalytics,
    getDifficultyBreakdown,
} = require('../controllers/analytics.controller');

router.get('/exam/:examId', authenticate, authorize('admin'), getExamAnalytics);
router.get('/difficulty/:examId', authenticate, getDifficultyBreakdown);

module.exports = router;
