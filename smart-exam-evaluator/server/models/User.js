const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 150,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'student'],
            default: 'student',
        },
        created_at: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: false, // Handled manually for created_at to match Sequelize
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for 'id' to maintain compatibility if needed
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
