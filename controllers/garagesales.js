const cities = require('../seed/cities');
const GarageSale = require('../models/garagesale.js');
const Review = require('../models/review.js');
const User = require('../models/user.js');

const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
});

//seed garage sale
module.exports.makegaragesale = async(req, res) => {
    await User.deleteMany({});
    await GarageSale.deleteMany({});
    await Review.deleteMany({});
    const user = new User({email: 'demo3@email.com', username: 'DEMO'});
    const newUser = await User.register(user, 'DEMOPW');
    const review = new Review({
        body: "This is a great garagesale. Just great!",
        rating: 4,
        author: newUser._id,
        timestamp: new Date()        
    });
    await review.save();
    for (let i = 0; i < 18; i++) {
        const garagesale = new GarageSale({
            title: cities[i].title,
            location: cities[i].city + ", " + cities[i].state,
            lat: cities[i].latitude,
            lng: cities[i].longitude,            
            timestamp: new Date,            
            startdate: '2021-08-17T02:37',
            enddate: '2021-08-20T14:38',
            author: newUser._id,
            images: cities[i].images,
            description: "It's a good one",
            reviews: [review._id]
        });
        await garagesale.save();
    }
    res.redirect(`/garagesales`);
}

//render index
module.exports.index = async(req, res) => {
    const garagesales = await GarageSale.find({});
    res.render('./garagesales/index', { garagesales });
}

//render new garagesale page
module.exports.rendernewgaragesale = (req, res) => {
    res.render('garagesales/new');
}

//make new garagesale
module.exports.newgaragesale = async(req, res) => {
    const garagesale = req.body;
    const gs = new GarageSale({
        title: garagesale["title"],
        location: garagesale["location"],
        timestamp: new Date(),
        startdate: garagesale["startdate"],
        enddate: garagesale["enddate"],
        description: garagesale["description"],
        author: req.user._id
    });

    //add date to filename then upload new file array to gcs bucket and add url to mongodb    
    const dateNow = Date.now().toString();
    const multerFiles = req.files;
    const { format } = require('util');
    const { bucket } = require('../cloudstorage/index');
    let blobNamesUrls = [];
    for (let multerFile of multerFiles) {
        const blob = bucket.file(multerFile.originalname); //upload the file to gcs bucket
        //change filename        
        const blobStream = blob.createWriteStream(); //initialize gcs write to file just uploaded so we can change name
        const newBlobName = dateNow + blob.name;
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${newBlobName}`);
        blobNamesUrls.push({"name": newBlobName, "url": publicUrl}); //push the renamed filename and url to renamed file holder array
        blobStream.on('finish', () => {
            blob.rename(newBlobName); //rename the gcs files
        });
        blobStream.end(multerFile.buffer);
    }
    gs.images = blobNamesUrls.map(f => ({ url: f.url, filename: f.name })); //map the array to align with renamed gcs files

    //geocoder code - takes inputted location and puts lat and lng into map
    await geocoder.geocode(garagesale.location, function (err, data) {
        if(err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        gs.lat = data[0].latitude;
        gs.lng = data[0].longitude;
        gs.location = data[0].formattedAddress;
    });

    await gs.save();
    req.flash('success', 'Successfully added a new garage sale!');
    res.redirect(`/garagesales/${gs._id}`);
}

//render show garagesale page
module.exports.showgaragesale = async(req, res) => {
    const { id } = req.params;
    //populate when referencing another collection's mongo object id
    const garagesale = await GarageSale.findById(id).populate({ path:'reviews', populate: { path: 'author' } }).populate('author');
    if (!garagesale) {
        req.flash('error', 'Cannot find that garage sale');
        return res.redirect('/garagesales')
    }
    await res.render('garagesales/show', { garagesale });
}

//render edit garagesale page
module.exports.showeditgaragesale = async(req, res) => {
    const { id } = req.params;
    const garagesale = await GarageSale.findById(id);
    if(!garagesale) {
        return res.redirect('/garagesales');
    }
    res.render('garagesales/edit', { garagesale });
}

//edit garage sale
module.exports.editgaragesale = async(req, res) => {
    const garagesale = req.body;
    const { id } = req.params;
    const startdate = new Date(garagesale["startdate"]);
    const gs = await GarageSale.findByIdAndUpdate(id, { 
        title: garagesale["title"],
        location: garagesale["location"],
        startdate: startdate,
        // startdate: garagesale["startdate"],
        enddate: garagesale["enddate"],
        // images: {url: garagesale["images"]},
        description: garagesale["description"]
    });

    //add date to filename then upload new file array to gcs bucket and add url to mongodb
    const dateNow = Date.now().toString();
    const multerFiles = req.files;
    const { format } = require('util');
    const { bucket } = require('../cloudstorage/index');
    let blobNamesUrls = [];
    for (let multerFile of multerFiles) {
        const blob = bucket.file(multerFile.originalname); //upload the file to gcs bucket
        const blobStream = blob.createWriteStream();
        const newBlobName = dateNow + blob.name;
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${newBlobName}`);
        blobNamesUrls.push({"name": newBlobName, "url": publicUrl}); //push the renamed filename and url to renamed file holder array
        blobStream.on('finish', () => {
            blob.rename(newBlobName); //rename the gcs files
        });
        blobStream.end(multerFile.buffer);
    }
    const imgs = blobNamesUrls.map(f => ({ url: f.url, filename: f.name })); //make seperate variable to map an array
    gs.images.push(...imgs); //push the data from the imgs array and spread into campground.images

    //geocoder code - takes inputted location and puts lat and lng into map
    await geocoder.geocode(garagesale.location, function (err, data) {
        if(err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        gs.lat = data[0].latitude;
        gs.lng = data[0].longitude;
        gs.location = data[0].formattedAddress;
    });

    await gs.save();

    //delete images from mongodb and cloud storage
    if (req.body.deleteImages) {
        //delete from cloud storage        
        for (let filename of req.body.deleteImages) {
            await bucket.deleteFiles({
                force: true,
                prefix: filename
            })
        }
        //delete from mongodb
        await gs.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages }}}});
        console.log(gs);
    }
    
    req.flash('success', 'Successfully updated garage sale!');
    await res.redirect(`/garagesales/${gs._id}`);
}

//delete garagesale
module.exports.deletegaragesale = async(req, res) => {
    const { id } = req.params;
    await GarageSale.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted garage sale!');
    res.redirect('/garagesales');
}