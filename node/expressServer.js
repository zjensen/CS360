var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var app = express();
var bodyParser = require('body-parser');
var ROOT_DIR = "/var/node";

var options = 
{
	host: '52.11.86.178',
	key: fs.readFileSync('/var/node/ssl/server.key'),
	cert: fs.readFileSync('/var/node/ssl/server.crt')
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);
app.get('/', function (req, res) 
{
	res.send("Get Index");
});

app.use('/', express.static('/var/node/', {maxAge: 60*60*1000}));
app.use(bodyParser());

app.get('/getcity', function (req, res) 
{
	var urlObj = url.parse(req.url, true, false);
	var myRe = new RegExp("^"+urlObj.query["q"]);
	fs.readFile('/var/node/cities.dat.txt', function (err, data) 
	{
		if(err) throw err;
		var cities = data.toString().split("\n");
		var matches = [];
		for(var i = 0; i < cities.length; i++) 
		{
			var result = cities[i].search(myRe);
			if(result != -1) 
			{
				matches.push({city:cities[i]});
			}
		}	
		res.writeHead(200);
		res.end(JSON.stringify(matches));
    });
});

app.get('/comment', function (req, res) 
{
	var MongoClient = require('mongodb').MongoClient;
	MongoClient.connect("mongodb://localhost/commentDB", function(err, db) 
	{
		if(err) throw err;
		db.collection("comment", function(err, comments)
		{
			if(err) throw err;
			comments.find(function(err, items)
			{
				items.toArray(function(err, itemArr)
				{
					res.status(200);
					res.end(JSON.stringify(itemArr));
				});
			});
		});
	});
});

var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function(user,pass) {
	return((user === 'cs360')&&(pass==='test'));
});

app.post('/comment', auth, function (req, res) 
{
	console.log("here1");
	var jsonData = req.body;
	console.log(typeof jsonData);
	var reqObj = jsonData;
	// reqObj = JSON.parse(jsonData);
	console.log(reqObj);
	console.log("Name: "+reqObj.Name);
	console.log("Comment: "+reqObj.Comment);
	// Now put it into the database
	var MongoClient = require('mongodb').MongoClient;
	MongoClient.connect("mongodb://localhost/commentDB", function(err, db) 
	{
		if(err) throw err;
		db.collection('comment').insert(reqObj,function(err, records) 
		{
			console.log("Record added as "+records[0]._id);
		});
	});
	res.status(200);
	res.end();
});










