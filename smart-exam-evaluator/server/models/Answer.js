const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
    {
        attempt_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attempt',
            required: true,
        },
        question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },
        selected_answer: {
            type: String,
            enum: ['a', 'b', 'c', 'd', null],
            default: null,
        },
        is_correct: {
            type: Boolean,
            required: true,
            default: false,
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

answerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Answer = mongoose.model('Answer', answerSchema);
module.exports = Answer;
