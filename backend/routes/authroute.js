const express = require('express');
const router = express.Router();

const { registerParticipant, loginUser , whoami} = require('../controller/authcontrol');
const { protect } = require('../middleware/authmiddleware');

//for profile whoami
router.get('/whoami', protect, whoami);

//for user login
router.post('/login', loginUser);

//for user registration
router.post('/register', registerParticipant);


module.exports = router;
