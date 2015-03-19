var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "/var/node";
http.createServer(function (req, res) {
  var urlObj = url.parse(req.url, true, false);
  if(urlObj.pathname.indexOf("getcity") !=-1) {
    var myRe = new RegExp("^"+urlObj.query["q"]);
    console.log(myRe);
    fs.readFile('/var/node/cities.dat.txt', function (err, data) {
      if(err) throw err;
      var cities = data.toString().split("\n");
      var matches = [];
      console.log(cities);
      for(var i = 0; i < cities.length; i++) {
        var result = cities[i].search(myRe);
        if(result != -1) {
          matches.push({city:cities[i]});
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify(matches));
    });
  }
  else if(urlObj.pathname.indexOf("comment") !=-1) {
    if(req.method === "POST") {
      console.log("POST comment route");
      var jsonData = "";
      req.on('data', function (chunk) {
        jsonData += chunk;
      });
      var reqObj;
      req.on('end', function () {
        reqObj = JSON.parse(jsonData);
        console.log(reqObj);
        console.log("Name: "+reqObj.Name);
        console.log("Comment: "+reqObj.Comment);
        // Now put it into the database
        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect("mongodb://localhost/commentDB", function(err, db) {
          if(err) throw err;
          db.collection('comment').insert(reqObj,function(err, records) {
            console.log("Record added as "+records[0]._id);
          });
        });
        res.writeHead(200);
        res.end("");
      });
    }
    else if(req.method === "GET") {
      console.log("GET comment route");
      var MongoClient = require('mongodb').MongoClient;
      MongoClient.connect("mongodb://localhost/commentDB", function(err, db) {
        if(err) throw err;
        db.collection("comment", function(err, comments){
          if(err) throw err;
          comments.find(function(err, items){
            items.toArray(function(err, itemArr){
              console.log("Document Array: ");
              console.log(itemArr);
              res.writeHead(200);
              res.end(JSON.stringify(itemArr));
            });
          });
        });
      });
    }
  }
  else
  {
    fs.readFile(ROOT_DIR + urlObj.pathname, function (err,data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
}).listen(80);

var options = {
    hostname: 'localhost',
    port: '80',
    path: '/test1.html'
  };

function handleResponse(response) {
  var serverData = '';
  response.on('data', function (chunk) {
    serverData += chunk;
  });
  response.on('end', function () {
    console.log(serverData);
  });
}
http.request(options, function(response){
  handleResponse(response);
}).end();