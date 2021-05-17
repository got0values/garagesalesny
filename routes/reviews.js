const express = require('express');
const router = express.Router({ mergeParams: true }); //merge params to read params from app.js
const { validateReview } = require('../middleware');
const catchAsync = require('../utils/catchAsync');
const review = require('../controllers/reviews');

//route to post new review
router.post('/', validateReview, catchAsync(review.createReview))

//rout to delete review
router.delete('/:reviewId', catchAsync(review.deleteReview))

module.exports = router;