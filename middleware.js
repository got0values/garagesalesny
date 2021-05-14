const { garagesaleSchema, reviewSchema } = require('./schemas.js')
const AppError = require('./utils/AppError');

//Joi error function that campground form input goes through first
module.exports.validateGarageSale = (req, res, next) => {
    const {error} = garagesaleSchema.validate(req.body);
    if (error){
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400);
    } else{
        next();
    }
}

//Joi error function to validate review forms
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error){
        const msg = error.details.map(el => el.message).join(',');
        throw new AppError(msg, 400);
    } else{
        next();
    }
}