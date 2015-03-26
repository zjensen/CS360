var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/news');
require('./models/Posts');
require('./models/Comments');

var app = express();
app.use('/', express.static('./public')).
    use('/images', express.static( '../images')).
    use('/lib', express.static( '../lib'));
// app.listen(8080);

module.exports = app;