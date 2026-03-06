const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true,
        },
        started_at: {
            type: Date,
            default: Date.now,
        },
        submitted_at: {
            type: Date,
        },
        total_score: {
            type: Number,
        },
        percentage: {
            type: Number,
        },
        correct_count: {
            type: Number,
        },
        wrong_count: {
            type: Number,
        },
        negative_marks: {
            type: Number,
            default: 0,
        },
        rank: {
            type: Number,
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index to prevent duplicate attempts by same student for same exam
attemptSchema.index({ student_id: 1, exam_id: 1 }, { unique: true });

attemptSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt;
