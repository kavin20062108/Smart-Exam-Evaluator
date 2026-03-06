const mongoose = require('mongoose');
const { Attempt, Answer, Question } = require('../models');

// GET /api/analytics/exam/:examId  (Admin)
const getExamAnalytics = async (req, res) => {
    try {
        const { examId } = req.params;
        const stats = await Attempt.aggregate([
            {
                $match: {
                    exam_id: new mongoose.Types.ObjectId(examId),
                    submitted_at: { $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    total_attempts: { $sum: 1 },
                    avg_percentage: { $avg: '$percentage' },
                    highest_score: { $max: '$total_score' },
                    lowest_score: { $min: '$total_score' },
                    passed: { $sum: { $cond: [{ $gte: ['$percentage', 50] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $lt: ['$percentage', 50] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            total_attempts: 0,
            avg_percentage: 0,
            highest_score: 0,
            lowest_score: 0,
            passed: 0,
            failed: 0
        };

        // Remove _id from result
        delete result._id;

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// GET /api/analytics/difficulty/:examId
const getDifficultyBreakdown = async (req, res) => {
    try {
        const { examId } = req.params;

        const pipeline = [
            {
                $lookup: {
                    from: 'questions',
                    localField: 'question_id',
                    foreignField: '_id',
                    as: 'q'
                }
            },
            { $unwind: '$q' },
            { $match: { 'q.exam_id': new mongoose.Types.ObjectId(examId) } },
            {
                $lookup: {
                    from: 'attempts',
                    localField: 'attempt_id',
                    foreignField: '_id',
                    as: 'att'
                }
            },
            { $unwind: '$att' }
        ];

        // If student, filter by their own attempts
        if (req.user.role === 'student') {
            pipeline.push({ $match: { 'att.student_id': new mongoose.Types.ObjectId(req.user.id) } });
        }

        pipeline.push({
            $group: {
                _id: '$q.difficulty_level',
                total_questions: { $sum: 1 },
                correct: { $sum: { $cond: [{ $eq: ['$is_correct', true] }, 1, 0] } },
                wrong: { $sum: { $cond: [{ $and: [{ $eq: ['$is_correct', false] }, { $ne: ['$selected_answer', null] }] }, 1, 0] } },
                skipped: { $sum: { $cond: [{ $eq: ['$selected_answer', null] }, 1, 0] } }
            }
        });

        pipeline.push({
            $project: {
                difficulty_level: '$_id',
                total_questions: 1,
                correct: 1,
                wrong: 1,
                skipped: 1,
                _id: 0
            }
        });

        const rows = await Answer.aggregate(pipeline);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch difficulty breakdown' });
    }
};

module.exports = { getExamAnalytics, getDifficultyBreakdown };
