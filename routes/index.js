var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var shortid = require('shortid');
var validator = require('validator');
var config = require('../config');
var mLab = 'mongodb://' + config.db.host + '/' + config.db.name;
//var mLab = "mongodb://user:pass@ds159188.mlab.com:59188/url-short";

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'API URL Shortener Microservice'
    });
});
router.get('/new/:url(*)', function (req, res) {
    var url = req.params.url;
    mongo.connect(mLab, function (err, db) {
        if (err) {
            return console.log(err);
        }
        else {
            var local = req.get('host') + '/';
            var links = db.collection('links');
            links.findOne({
                "url": url
            }, {
                short_url: 1
                , _id: 0
            }, function (err, doc) {
                if (doc !== null) {
                    res.json({
                        "original_url": url
                        , "short_url": local + doc.short_url
                    });
                }
                else {
                    if (validator.isURL(url, {
                            require_protocol: true
                        })) {
                        shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
                        var short = shortid.generate();
                        links.insert({
                            "url": url
                            , "short_url": short
                        });
                        res.json({
                            "original_url": url
                            , "short_url": local + short
                        });
                        db.close();
                    }
                    else {
                        res.json({
                            error: "Wrong url format, make sure you have a valid protocol and real site."
                        });
                    }
                }
            });
        }
    });
});
router.get('/:short', function (req, res) {
    mongo.connect(mLab, function (err, db) {
        if (err) {
            return console.log(err);
        }
        else {
            var links = db.collection('links');
            var shortUrl = req.params.short;
            links.findOne({
                "short_url": shortUrl
            }, {
                url: 1
                , _id: 0
            }, function (err, doc) {
                if (doc !== null) {
                    res.redirect(doc.url);
                }
                else {
                    res.json({
                        error: "No corresponding shortlink found in the database."
                    });
                }
            });
        }
    });
});
module.exports = router;