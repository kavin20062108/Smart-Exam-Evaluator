const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true,
        },
        question_text: {
            type: String,
            required: true,
        },
        option_a: {
            type: String,
            required: true,
            maxlength: 500,
        },
        option_b: {
            type: String,
            required: true,
            maxlength: 500,
        },
        option_c: {
            type: String,
            required: true,
            maxlength: 500,
        },
        option_d: {
            type: String,
            required: true,
            maxlength: 500,
        },
        correct_answer: {
            type: String,
            enum: ['a', 'b', 'c', 'd'],
            required: true,
        },
        marks: {
            type: Number,
            required: true,
            default: 1,
        },
        difficulty_level: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

questionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
