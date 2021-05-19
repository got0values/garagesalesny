//multer stuff for routes
const Multer  = require('multer');
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        }
        else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});

//google cloud storage stuff for createGaragesale controller
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const bucketName = 'garagesalesny-images';
const storage = new Storage({
    keyFilename: path.join(__dirname, process.env.GC_STORAGE_BUCKET_KEY_LOCATION),
    projectId: "garagesalesny"
});
const bucket = storage.bucket(bucketName);



module.exports = { multer, bucket };