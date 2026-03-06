const { Exam, User, Question } = require('../models');

// GET /api/exams
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate('created_by', 'name')
            .sort({ created_at: -1 });
        res.json(exams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
};

// GET /api/exams/:id
const getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('created_by', 'name');

        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Manual fetch of questions since Mongoose doesn't have same auto-include association
        const questions = await Question.find({ exam_id: exam._id });

        const examObj = exam.toObject();
        examObj.questions = questions;

        res.json(examObj);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
};

// POST /api/exams
const createExam = async (req, res) => {
    try {
        const { title, subject, duration, total_marks } = req.body;
        const exam = await Exam.create({
            title,
            subject,
            duration,
            total_marks,
            created_by: req.user.id,
        });
        res.status(201).json(exam);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create exam' });
    }
};

// PUT /api/exams/:id
const updateExam = async (req, res) => {
    try {
        const { title, subject, duration, total_marks } = req.body;
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { title, subject, duration, total_marks },
            { new: true }
        );
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update exam' });
    }
};

// DELETE /api/exams/:id
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Cascading delete for questions
        await Question.deleteMany({ exam_id: req.params.id });

        res.json({ message: 'Exam deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
};

module.exports = { getAllExams, getExamById, createExam, updateExam, deleteExam };
