//Joi validates data before it's even sent to mongo (in case user using something like postman to go around bootstrap form validation)
// variables are passed to its middleware functions
const Joi = require('joi');


module.exports.garagesaleSchema = Joi.object({
    title: Joi.string().required(),
    images: Joi.any(),
    location: Joi.string().required(),
    description: Joi.string().required()
})

module.exports.reviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required()
})