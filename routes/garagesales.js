const express = require('express');
const router = express.Router();
const garagesales = require('../controllers/garagesales');
const catchAsync = require('../utils/catchAsync');

router.get('/', catchAsync(garagesales.index));

router.get('/', (req, res, next) => {
    res.send("hey there");
    next();
});

// router.get('/makegaragesale', catchAsync(garagesales.makegaragesale));