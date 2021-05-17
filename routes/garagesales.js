const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateGarageSale, isAuthor } = require('../middleware');
const garagesale = require('../controllers/garagesales');

//route to render garage sale index
router.get('/', catchAsync(garagesale.index))

//route to render new garage sale page
router.get('/new', isLoggedIn, garagesale.rendernewgaragesale)

//route to make new garage sale
router.post('/', isLoggedIn, validateGarageSale, catchAsync(garagesale.newgaragesale))

//route to seed garagesale
router.get('/makegaragesale', catchAsync(garagesale.makegaragesale))

//route to render show page for a garage sale
router.get('/:id', catchAsync(garagesale.showgaragesale))

//route to render the edit page for a campground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(garagesale.showeditgaragesale))

//route to edit the particular garagesale
router.put('/:id', isLoggedIn, isAuthor, catchAsync(garagesale.editgaragesale))

//route to delete particular campground
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(garagesale.deletegaragesale))

module.exports = router;