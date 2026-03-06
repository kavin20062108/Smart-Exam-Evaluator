const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validate, schemas } = require('../validators/schemas');
const {
    startAttempt,
    submitAttempt,
    getMyAttempts,
    getAttemptResult,
    getAllResults,
    getLeaderboard,
} = require('../controllers/attempt.controller');

// Student routes
router.post('/start', authenticate, authorize('student'), startAttempt);
router.post('/:id/submit', authenticate, authorize('student'), validate(schemas.submitAnswers), submitAttempt);
router.get('/my', authenticate, authorize('student'), getMyAttempts);
router.get('/:id/result', authenticate, getAttemptResult);

// Admin routes
router.get('/admin/results', authenticate, authorize('admin'), getAllResults);
router.get('/leaderboard/:examId', authenticate, getLeaderboard);

module.exports = router;
