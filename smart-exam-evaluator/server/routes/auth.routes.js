const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { validate, schemas } = require('../validators/schemas');

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);

module.exports = router;
