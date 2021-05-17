const GarageSale = require('../models/garagesale.js');
const Review = require('../models/review.js');
const User = require('../models/user.js');

//seed garage sale
module.exports.makegaragesale = async(req, res) => {
    await User.deleteMany({});
    await GarageSale.deleteMany({});
    await Review.deleteMany({});
    const user = new User({email: 'demo3@email.com', username: 'DEMO'});
    const newUser = await User.register(user, 'DEMOPW');
    const review = new Review({
        body: "This is great garagesale. Just great!",
        rating: 4,
        author: newUser._id,
        timestamp: new Date()        
    });
    await review.save();
    for (let i = 0; i < 20; i++) {
        const garagesale = new GarageSale({
            title: "Amazing Garage Sale!",
            location: "Hicksville, NY",
            timestamp: new Date,            
            startdate: '2021-05-17T02:38',
            enddate: '2021-05-20T14:38',
            author: newUser._id,
            images: [{
                url: "https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1016&q=80",
                filename: "photo-1488841714725-bb4c32d1ac94.jpg"
            }],
            description: "It's a good one",
            reviews: [review._id]
        });
        await garagesale.save();
    }
    res.redirect(`/garagesales`);
}

module.exports.index = async(req, res) => {
    const garagesales = await GarageSale.find({});
    res.render('./garagesales/index', { garagesales });
}

module.exports.rendernewgaragesale = (req, res) => {
    res.render('garagesales/new');
}

module.exports.newgaragesale = async(req, res) => {
    const garagesale = req.body;
    const images = [];
    images.push({url: garagesale["images"]});
    const gs = new GarageSale({
        title: garagesale["title"],
        location: garagesale["location"],
        timestamp: new Date(),
        startdate: garagesale["startdate"],
        enddate: garagesale["enddate"],
        images: images,
        description: garagesale["description"],
        author: req.user._id
    });
    await gs.save();
    res.redirect(`/garagesales/${gs._id}`);
}

module.exports.showgaragesale = async(req, res) => {
    const { id } = req.params;
    //populate when referencing another collection's mongo object id
    const garagesale = await GarageSale.findById(id).populate({ path:'reviews', populate: { path: 'author' } }).populate('author');
    if (!garagesale) {
        req.flash('error', 'Cannot find that garage sale');
        return res.redirect('/garagesales')
    }
    res.render('garagesales/show', { garagesale });
}

module.exports.showeditgaragesale = async(req, res) => {
    const { id } = req.params;
    const garagesale = await GarageSale.findById(id);
    if(!garagesale) {
        return res.redirect('/garagesales');
    }
    res.render('garagesales/edit', { garagesale });
}

module.exports.editgaragesale = async(req, res) => {
    const garagesale = req.body;
    const { id } = req.params;
    const gs = await GarageSale.findByIdAndUpdate(id, { 
        title: garagesale["title"],
        location: garagesale["location"],
        images: {url: garagesale["images"]},        
        description: garagesale["description"]
    });
    await gs.save();
    res.redirect(`/garagesales/${gs._id}`);
}

module.exports.deletegaragesale = async(req, res) => {
    const { id } = req.params;
    await GarageSale.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted garage sale!');
    res.redirect('/garagesales');
}