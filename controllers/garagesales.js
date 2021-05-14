const GarageSale = require('../models/garagesale.js');

module.exports.index = async (req, res) => {
    const garagesales = await GarageSale.find({});
    res.send(garagesales);
    // res.render('garagesales/index', { garagesales });
}

module.exports.makegaragesale = (req, res) => {
    const garagesale = new GarageSale({
        title: "This is a new garage sale",
        images: [{
            url: "https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1016&q=80",
            filename: "photo-1488841714725-bb4c32d1ac94.jpg"
        }],
        description: "It's a good one"
    });
    garagesale.save();
    res.send(garagesale);
}