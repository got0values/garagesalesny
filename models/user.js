const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

//adds a field for passport, unique usernames, and additional fields
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);