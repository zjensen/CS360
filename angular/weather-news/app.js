var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/news');
require('./models/Posts');
require('./models/Comments');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes).
	use('/users', users);
app.listen(80);

module.exports = app;