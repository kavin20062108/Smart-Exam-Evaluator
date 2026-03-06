const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validate, schemas } = require('../validators/schemas');
const {
    getQuestionsByExam,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkCreateQuestions,
} = require('../controllers/question.controller');

// Student gets shuffled questions (protected)
router.get('/exam/:examId', authenticate, getQuestionsByExam);

// Admin only
router.post('/bulk', authenticate, authorize('admin'), bulkCreateQuestions);
router.post('/', authenticate, authorize('admin'), validate(schemas.createQuestion), createQuestion);
router.put('/:id', authenticate, authorize('admin'), updateQuestion);
router.delete('/:id', authenticate, authorize('admin'), deleteQuestion);

module.exports = router;
