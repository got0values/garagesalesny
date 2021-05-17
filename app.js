//if we're not in production (in development) use dotenv
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

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
const garagesaleRoutes = require('./routes/garagesales.js');
const reviewRoutes = require('./routes/reviews.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')
const userRoutes = require('./routes/users')

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
//configure and enable sessions (server sends and assigns session_id to client, then server can use session_id to store client state) and sign (make sure cookie's integrity hasn't changed) cookies for flash and authentication
app.use(session({
    name: 'session',
    secret: process.env.SESSION_SECRET,
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
//enable passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//use local authenticate from passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));
//store and unstore passport sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render('home');
})

//use routes folder to make this file less crowded
app.use('/', userRoutes);
app.use(express.json());
app.use('/garagesales', garagesaleRoutes);
app.use('/garagesales/:id/reviews', reviewRoutes);


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
