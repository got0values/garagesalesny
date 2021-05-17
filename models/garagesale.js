const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const GarageSaleSchema = new Schema({
    title: String,
    location: String,
    timestamp: Date,
    startdate: Date,
    enddate: Date,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
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

//delete reviews in mongodb for particular garage sale when that garagesale is deleted
GarageSaleSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('GarageSale', GarageSaleSchema);