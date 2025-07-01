const express = require('express');
const router = express.Router();
const apiService = require('../services/apiService');

router.use('/api', apiService);

module.exports = router;