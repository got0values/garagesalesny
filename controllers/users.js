const User = require('../models/user.js');

module.exports.renderRegister = (req, res) => {
    res.render('./users/register');
}

module.exports.registerUser = async(req, res) => {
    try{
        const { email, username, password } = req.body;
        const newUser = new User({
            username: username,
            email: email
        });
        const registeredUser = await User.register(newUser, password);
        //login user after registering
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Garage Sales NY!');
            res.redirect('/garagesales');
    })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('./users/login');
}

module.exports.loginUser = (req, res) => {
    req.flash('success', `Welcome back, ${ req.user.username }!`);
    const redirectUrl = req.session.returnTo || '/garagesales'; //goes to stored location that user wanted to go to before logging in
    delete req.session.returnTo; //delete returnTo from session
    res.redirect(redirectUrl);
}

module.exports.logoutUser = (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
}