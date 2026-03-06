const { Question, Exam } = require('../models');

// Fisher-Yates shuffle
const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const shuffleOptions = (q) => {
    const optionKeys = ['a', 'b', 'c', 'd'];
    const originalOptions = {
        a: q.option_a,
        b: q.option_b,
        c: q.option_c,
        d: q.option_d,
    };
    const correctText = originalOptions[q.correct_answer];
    const shuffledKeys = shuffle([...optionKeys]);

    const newOptions = {};
    let newCorrect = '';
    shuffledKeys.forEach((origKey, newIdx) => {
        const newKey = optionKeys[newIdx];
        newOptions[`option_${newKey}`] = originalOptions[origKey];
        if (originalOptions[origKey] === correctText) {
            newCorrect = newKey;
        }
    });
    return { ...q, ...newOptions, correct_answer: newCorrect };
};

// GET /api/questions/exam/:examId  (student gets shuffled, admin gets raw)
const getQuestionsByExam = async (req, res) => {
    try {
        const questions = await Question.find({ exam_id: req.params.examId });
        if (!questions.length) return res.json([]);

        // Mongoose documents to plain objects
        const plain = questions.map((q) => q.toObject());
        const shuffledQs = shuffle(plain);

        // For students, strip correct_answer
        if (req.user.role === 'student') {
            const studentView = shuffledQs.map((q) => {
                const { correct_answer, ...rest } = q;
                return rest;
            });
            return res.json(studentView);
        }
        // Admins get everything
        return res.json(plain);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
};

// POST /api/questions
const createQuestion = async (req, res) => {
    try {
        const q = await Question.create(req.body);
        res.status(201).json(q);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create question' });
    }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!q) return res.status(404).json({ error: 'Question not found' });
        res.json(q);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update question' });
    }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
    try {
        const q = await Question.findByIdAndDelete(req.params.id);
        if (!q) return res.status(404).json({ error: 'Question not found' });
        res.json({ message: 'Question deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete question' });
    }
};

// POST /api/questions/bulk
const bulkCreateQuestions = async (req, res) => {
    try {
        const { exam_id, questions } = req.body;
        if (!exam_id) return res.status(400).json({ error: 'exam_id is required' });
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'questions must be a non-empty array' });
        }

        const VALID_OPTIONS = ['a', 'b', 'c', 'd'];
        const VALID_DIFF = ['easy', 'medium', 'hard'];
        const errors = [];
        const docs = [];

        questions.forEach((q, i) => {
            const row = i + 1;
            if (!q.question_text) { errors.push(`Q${row}: question_text is required`); return; }
            if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) { errors.push(`Q${row}: all four options are required`); return; }
            if (!VALID_OPTIONS.includes(String(q.correct_answer).toLowerCase())) { errors.push(`Q${row}: correct_answer must be a, b, c or d`); return; }
            docs.push({
                exam_id,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: String(q.correct_answer).toLowerCase(),
                marks: Number(q.marks) || 1,
                difficulty_level: VALID_DIFF.includes(q.difficulty_level) ? q.difficulty_level : 'medium',
            });
        });

        if (docs.length === 0) {
            return res.status(400).json({ error: 'No valid questions to insert', details: errors });
        }

        const inserted = await Question.insertMany(docs);
        res.status(201).json({
            message: `${inserted.length} question(s) added successfully`,
            inserted: inserted.length,
            skipped: questions.length - inserted.length,
            errors,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Bulk import failed' });
    }
};

module.exports = { getQuestionsByExam, createQuestion, updateQuestion, deleteQuestion, bulkCreateQuestions };
