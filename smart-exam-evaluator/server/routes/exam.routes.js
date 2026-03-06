const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validate, schemas } = require('../validators/schemas');
const {
    getAllExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
} = require('../controllers/exam.controller');

// Public / Student + Admin
router.get('/', authenticate, getAllExams);
router.get('/:id', authenticate, getExamById);

// Admin only
router.post('/', authenticate, authorize('admin'), validate(schemas.createExam), createExam);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.createExam), updateExam);
router.delete('/:id', authenticate, authorize('admin'), deleteExam);

module.exports = router;
