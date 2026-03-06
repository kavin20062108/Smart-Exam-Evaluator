const { Attempt, Answer, Question, Exam, User } = require('../models');

// POST /api/attempts/start
const startAttempt = async (req, res) => {
    try {
        const { exam_id } = req.body;
        const exam = await Exam.findById(exam_id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Prevent duplicate attempts
        const existing = await Attempt.findOne({
            student_id: req.user.id,
            exam_id,
        });
        if (existing) {
            return res.status(409).json({
                error: 'You have already attempted this exam',
                attempt_id: existing.id,
            });
        }

        const attempt = await Attempt.create({
            student_id: req.user.id,
            exam_id,
            started_at: new Date(),
        });
        res.status(201).json(attempt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to start exam' });
    }
};

// POST /api/attempts/:id/submit
const submitAttempt = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }
        if (attempt.student_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Not your attempt' });
        }
        if (attempt.submitted_at) {
            return res.status(409).json({ error: 'Exam already submitted' });
        }

        const exam = await Exam.findById(attempt.exam_id);
        const questions = await Question.find({ exam_id: attempt.exam_id });

        const { answers } = req.body; // [{ question_id, selected_answer }]
        const questionMap = {};
        questions.forEach((q) => (questionMap[q.id] = q));

        const NEGATIVE_FRACTION = parseFloat(process.env.NEGATIVE_MARKS_FRACTION || 0.25);
        let correct_count = 0;
        let wrong_count = 0;
        let total_score = 0;
        let negative_marks = 0;
        const answerRows = [];

        for (const ans of answers) {
            const q = questionMap[ans.question_id];
            if (!q) continue;
            const is_correct =
                ans.selected_answer !== null &&
                ans.selected_answer !== undefined &&
                ans.selected_answer === q.correct_answer;

            if (is_correct) {
                correct_count++;
                total_score += q.marks;
            } else if (ans.selected_answer !== null && ans.selected_answer !== undefined) {
                wrong_count++;
                const deduction = q.marks * NEGATIVE_FRACTION;
                negative_marks += deduction;
                total_score -= deduction;
            }

            answerRows.push({
                attempt_id: attempt.id,
                question_id: ans.question_id,
                selected_answer: ans.selected_answer || null,
                is_correct,
            });
        }

        total_score = Math.max(0, parseFloat(total_score.toFixed(2)));
        negative_marks = parseFloat(negative_marks.toFixed(2));
        const percentage = parseFloat(((total_score / exam.total_marks) * 100).toFixed(2));

        // Bulk insert answers
        await Answer.insertMany(answerRows);

        // Update attempt
        attempt.submitted_at = new Date();
        attempt.total_score = total_score;
        attempt.percentage = percentage;
        attempt.correct_count = correct_count;
        attempt.wrong_count = wrong_count;
        attempt.negative_marks = negative_marks;
        await attempt.save();

        // Calculate rank (Mongoose version of the SQL query)
        const submitted = await Attempt.find({ exam_id: attempt.exam_id, submitted_at: { $ne: null } })
            .sort({ total_score: -1 });

        let currentRank = 0;
        let lastScore = -1;
        for (let i = 0; i < submitted.length; i++) {
            if (submitted[i].total_score !== lastScore) {
                currentRank = i + 1;
            }
            submitted[i].rank = currentRank;
            lastScore = submitted[i].total_score;
            await submitted[i].save();
        }

        const updated = await Attempt.findById(attempt.id);
        res.json({ message: 'Exam submitted successfully', result: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Submission failed' });
    }
};

// GET /api/attempts/my
const getMyAttempts = async (req, res) => {
    try {
        const attempts = await Attempt.find({ student_id: req.user.id })
            .populate({
                path: 'exam_id',
                select: 'title subject total_marks',
            })
            .sort({ started_at: -1 });

        // Transform to match old format if frontend expects 'exam' key instead of 'exam_id'
        const results = attempts.map(a => {
            const obj = a.toObject();
            obj.exam = obj.exam_id;
            delete obj.exam_id;
            return obj;
        });

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
};

// GET /api/attempts/:id/result
const getAttemptResult = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('exam_id');
        if (!attempt) return res.status(404).json({ error: 'Result not found' });

        // Students can only see their own
        if (req.user.role === 'student' && attempt.student_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const answers = await Answer.find({ attempt_id: attempt._id }).populate('question_id');

        const attemptObj = attempt.toObject();
        attemptObj.exam = attemptObj.exam_id;
        delete attemptObj.exam_id;

        attemptObj.answers = answers.map(ans => {
            const a = ans.toObject();
            a.question = a.question_id;
            delete a.question_id;
            return a;
        });

        res.json(attemptObj);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch result' });
    }
};

// GET /api/attempts/admin/results
const getAllResults = async (req, res) => {
    try {
        const { exam_id } = req.query;
        const filter = exam_id ? { exam_id } : {};
        const results = await Attempt.find(filter)
            .populate('student_id', 'name email')
            .populate('exam_id', 'title subject')
            .sort({ total_score: -1 });

        const transformed = results.map(r => {
            const obj = r.toObject();
            obj.student = obj.student_id;
            obj.exam = obj.exam_id;
            delete obj.student_id;
            delete obj.exam_id;
            return obj;
        });

        res.json(transformed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};

// GET /api/attempts/leaderboard/:examId
const getLeaderboard = async (req, res) => {
    try {
        const results = await Attempt.find({
            exam_id: req.params.examId,
            submitted_at: { $ne: null }
        })
            .populate('student_id', 'name')
            .sort({ total_score: -1 })
            .limit(50);

        const transformed = results.map(r => {
            const obj = r.toObject();
            obj.student = obj.student_id;
            delete obj.student_id;
            return obj;
        });

        res.json(transformed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

module.exports = { startAttempt, submitAttempt, getMyAttempts, getAttemptResult, getAllResults, getLeaderboard };
