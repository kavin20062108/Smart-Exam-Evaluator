const Joi = require('joi');

const schemas = {
    register: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'student').default('student'),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    createExam: Joi.object({
        title: Joi.string().min(3).max(200).required(),
        subject: Joi.string().min(2).max(100).required(),
        duration: Joi.number().integer().min(1).required(),
        total_marks: Joi.number().positive().required(),
    }),

    createQuestion: Joi.object({
        exam_id: Joi.string().required(),
        question_text: Joi.string().min(5).required(),
        option_a: Joi.string().required(),
        option_b: Joi.string().required(),
        option_c: Joi.string().required(),
        option_d: Joi.string().required(),
        correct_answer: Joi.string().valid('a', 'b', 'c', 'd').required(),
        marks: Joi.number().positive().default(1),
        difficulty_level: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    }),

    submitAnswers: Joi.object({
        answers: Joi.array()
            .items(
                Joi.object({
                    question_id: Joi.string().required(),
                    selected_answer: Joi.string().valid('a', 'b', 'c', 'd', null).allow(null),
                })
            )
            .required(),
    }),
};

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map((d) => d.message);
        return res.status(400).json({ errors: messages });
    }
    next();
};

module.exports = { schemas, validate };
