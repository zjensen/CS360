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