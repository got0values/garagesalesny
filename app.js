const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const GarageSale = require('./models/garagesale');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');
const { validateGarageSale, validateReview } = require('./middleware.js');
const Review = require('./models/review');

//connect to the mongodb server
mongoose.connect('mongodb://localhost:27017/garagesalesny', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

//use ejsmate to allow us to use boilerplate layout
app.engine('ejs', ejsMate);
//join the views directory
app.set('views', path.join(__dirname, 'views'));
//set the view engine to ejs
app.set('view engine', 'ejs');

//make public directory public
app.use(express.static(path.join(__dirname, 'public')));
//make forms return req.body parsed
app.use(express.urlencoded({ extended: true }));
//allow update and delete methods
app.use(methodOverride('_method'));
//configure and enable sessions to sign cookies for flash and authentication
app.use(session({
    name: 'session',
    secret: 'thisisasecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
//enable flash
app.use(flash());
//defining variables that can be used for each view ejs page
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/garagesales', catchAsync(async(req, res) => {
    const garagesales = await GarageSale.find({});
    res.render('./garagesales/index', { garagesales });
}))

app.get('/garagesales/new', (req, res) => {
    res.render('garagesales/new');
})

app.post('/garagesales', validateGarageSale, catchAsync(async(req, res) => {
    const garagesale = req.body;
    const images = [];
    images.push({url: garagesale["images"]});
    const gs = new GarageSale({
        title: garagesale["title"],
        location: garagesale["location"],
        images: images,
        description: garagesale["description"]
    });
    await gs.save();
    res.redirect(`/garagesales/${gs._id}`);
}))

//seed
app.get('/garagesales/makegaragesale', catchAsync(async(req, res) => {
    const review = new Review({
        body: "This is great garagesale. Just great!",
        rating: 4
    })
    await review.save();
    const garagesale = new GarageSale({
        title: "This is a new garage sale",
        location: "Columbus, OH",
        images: [{
            url: "https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1016&q=80",
            filename: "photo-1488841714725-bb4c32d1ac94.jpg"
        }],
        description: "It's a good one",
        reviews: [review._id]
    });
    await garagesale.save();
    res.redirect(`/garagesales/${garagesale._id}`);
}))

app.get('/garagesales/:id', catchAsync(async(req, res) => {
    const { id } = req.params;
    //populate when referencing another collection's mongo object id
    const garagesale = await GarageSale.findById(id).populate({
        path:'reviews'
    });
    if (!garagesale) {
        req.flash('error', 'Cannot find that garage sale');
        return res.redirect('/garagesales')
    }
    res.render('garagesales/show', { garagesale });
}))

app.get('/garagesales/:id/edit', catchAsync(async(req, res) => {
    const { id } = req.params;
    const garagesale = await GarageSale.findById(id);
    if(!garagesale) {
        return res.redirect('/garagesales');
    }
    res.render('garagesales/edit', { garagesale });
}))

app.put('/garagesales/:id', catchAsync(async(req, res) => {
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
}))

app.delete('/garagesales/:id', catchAsync(async(req, res) => {
    const { id } = req.params;
    await GarageSale.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted garage sale!');
    res.redirect('/garagesales');
}))

app.post('/garagesales/:id/reviews', validateReview, catchAsync(async(req, res) => {
    const garagesale = await GarageSale.findById(req.params.id);
    const review = new Review({
        body: req.body["body"],
        rating: req.body["rating"]
    });
    garagesale.reviews.push(review);
    await review.save();
    await garagesale.save();
    req.flash('success', 'Added new review');
    res.redirect(`/garagesales/${garagesale._id}`);
}))

app.delete('/garagesales/:id/reviews/:reviewId', catchAsync(async(req, res) => {
    const { id, reviewId } = req.params;
    //UPDATE the GARAGESALE collection to remove the specific reviews object from mongodb based on garagesale id and review id
    await GarageSale.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    //delete the specific REVIEWS collection object based on review id
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review')
    res.redirect(`/garagesales/${id}`);
}))

//*************************error handling stuff***********

//run if none of the above routes match
app.all('*', (req, res, next) => {
    next(new AppError('Page Not Found', 404));
})

//use when an error passed from catchAsync next anywhere above
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err; //destructuring the error passed from next(new AppError()) above
    if (!err.message) err.message = "Oh no! Something went wrong!"
    res.status(statusCode).render('error', { err });
})

//*************************error handling stuff***********

//connect to server
app.listen(8080, () => {
    console.log('Serving on port 8080');
})
