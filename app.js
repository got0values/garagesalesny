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
const DB_URL = process.env.GSNY_DB_URL;
// const SESSION_SECRET = process.env.SESSION_SECRET;
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const MongoDBStore = require('connect-mongo');
const MDBSTORE_SECRET = process.env.MDBSTORE_SECRET;

//connect to the mongodb server
mongoose.connect(DB_URL, {
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
//sanitizes user-supplied data to prevent MongoDB Operator Injection
app.use(mongoSanitize({
    replaceWith: '_'
}));
//allow update and delete methods
app.use(methodOverride('_method'));

//connect-mongo-session
const store = MongoDBStore.create({
    mongoUrl: DB_URL,
    secret: MDBSTORE_SECRET,
    touchAfter: 24 * 60 * 60
})
store.on('error', function(e) {
    console.log("SESSION STORE ERROR", e);
})
//configure and enable sessions (server sends and assigns session_id to client, then server can use session_id to store client state) and sign (make sure cookie's integrity hasn't changed) cookies for flash and authentication
app.use(session({
    store,
    name: 'session',
    secret: MDBSTORE_SECRET,
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
//defining flash variables that can be used for each view ejs page
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
//helmet configuration
const scriptSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdjns.cloudflare.com/",
    "https://maps.googleapis.com/",
    "https://cdnjs.cloudflare.com/ajax/libs/js-marker-clusterer/",    
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://cdnjs.cloudflare.com/",    
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://maps.googleapis.com/"
];
const connectSrcUrls = [
    "https://maps.googleapis.com/maps/api/"
];
const fontSrcUrls = [
    "https://fonts.gstatic.com/"    
];
const imgSrcUrls = [
    "https://maps.gstatic.com/mapfiles/",

]
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://maps.gstatic.com/mapfiles/",
            "https://developers.google.com/maps/documentation/javascript/examples/",
            "https://maps.googleapis.com/",
            "https://storage.googleapis.com/garagesalesny-images/",
            "https://images.unsplash.com/",
        ],
        fontSrc: ["'self'", ...fontSrcUrls],
    },
}));
//enable passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//use local authenticate from passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));
//store and unstore passport sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//defining currentUser variables that can be used for each view ejs page with passport
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();    
})

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
