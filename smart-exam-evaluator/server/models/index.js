const connectDB = require('../config/db');
const User = require('./User');
const Exam = require('./Exam');
const Question = require('./Question');
const Attempt = require('./Attempt');
const Answer = require('./Answer');

// With Mongoose, associations are handled via `ref` in schemas, not here.
// syncDB simply connects to MongoDB.
const syncDB = async () => {
    await connectDB();
};

module.exports = { syncDB, User, Exam, Question, Attempt, Answer };
