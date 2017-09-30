var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/* GET create stream page. */
router.get('/create-stream', function (req, res, next) {
    res.render('create-stream');
});

/* GET publish stream page. */
router.get('/publish-stream', function (req, res, next) {
    res.render('publish-stream');
});

/* GET view stream page. */
router.get('/view-stream', function (req, res, next) {
    res.render('view-stream');
});


module.exports = router;
