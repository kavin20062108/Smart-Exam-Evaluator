const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        duration: {
            type: Number, // in minutes
            required: true,
            min: 1,
        },
        total_marks: {
            type: Number,
            required: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

examSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
