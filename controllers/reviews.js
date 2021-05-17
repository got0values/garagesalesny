const GarageSale = require('../models/garagesale');
const Review = require('../models/review');


module.exports.createReview = async(req, res) => {
    console.log(req.params);
    const garagesale = await GarageSale.findById(req.params.id);
    const review = new Review({
        body: req.body["body"],
        rating: req.body["rating"],
        author: req.user._id,
        timestamp: Date.now()     
    });
    garagesale.reviews.push(review);
    await review.save();
    await garagesale.save();
    req.flash('success', 'Added new review');
    res.redirect(`/garagesales/${garagesale._id}`);
}

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;
    //UPDATE the GARAGESALE collection to remove the specific reviews object from mongodb based on garagesale id and review id
    await GarageSale.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    //delete the specific REVIEWS collection object based on review id
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review')
    res.redirect(`/garagesales/${id}`);
}