const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GarageSaleSchema = new Schema({
    title: String,
    location: String,
    images: [
        {
            url: String,
            filename: String
        }
    ],
    description: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

module.exports = mongoose.model('GarageSale', GarageSaleSchema);