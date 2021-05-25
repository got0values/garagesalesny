//Joi validates data before it's even sent to mongo (in case user using something like postman to go around bootstrap form validation)
// variables are passed to its middleware functions
const BaseJoi = require('joi');
//sanitize-html cleans up HTML fragments such as those created by CKEditor and other rich text editors. It is especially handy for removing unwanted CSS when copying and pasting from Word
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
})

const Joi = BaseJoi.extend(extension)

module.exports.garagesaleSchema = Joi.object({
    title: Joi.string().required().escapeHTML(),
    images: Joi.any(),
    location: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
    startdate: Joi.date().required(),
    enddate: Joi.date().required(),
    deleteImages: Joi.array()
})

module.exports.reviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML()
})