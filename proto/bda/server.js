var mongojs = require('mongojs');
var util = require('util');
var fs = require('fs');
var http = require("http");
var path = require("path");
var url = require('url');
var query = require('./query.js');
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};
console.log( 'query='+util.inspect(query) );

var uiFilePath = './ui.html';
function onRequest(request, response) {
  var uri = url.parse(request.url).pathname;
  console.log("server -->");
  var urlObj = url.parse(request.url, true);
  console.dir(urlObj);

  console.log("server -->");
  
  console.log("Request received for uri=" + uri);
  if ( uri === '/' ) { uri = uiFilePath; }
  var filename = path.join(process.cwd(), uri);
  //console.log("Request received for " + filename + 'uri='+uri);
  if ( uri.slice(1,2)==='+' ) { // api call 
      // in this case - we have an API query call to delegate to!
      // var qStream = q.createQueryStream(uri);
      // util.pump(qStream,response) -- hook up queryStream to response.
      //console.log("not exists: " + filename);
      response.writeHead(200, {'Content-Type': 'text/javascript'});
      //response.write('404 Not Found\n');
      var op = uri.slice(2,3);
      console.log(' -----> op=' + op + " ----------------");
      if ( op === 'q' ) {
        query.query(uri.slice(4),response);
      } else if ( op === 'd' ) {
        query.details(uri.slice(4), response);
      }
      //response.end();
   } else if ( urlObj.query['term'] ) {
      var conceptSearch = require('./asn12js/canarySearch.js');
      conceptSearch.jsonConceptSearch( urlObj.query['term'], response);
    } else if ( urlObj.query['ncid'] ) {
      var conceptSearch = require('./asn12js/canarySearch.js');
      conceptSearch.jsonEncounterWithNcidSearch( urlObj.query['ncid'], response);
    } else if ( urlObj.query['ncidPower'] ) {
      var conceptSearch = require('./asn12js/canarySearch.js');
      conceptSearch.encPwrConcept( urlObj.query['ncidPower'], response);
    } else {
       path.exists(filename, function(exists) {
        if ( exists ) {
          var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
          var stat = fs.statSync(filename);
          console.log("---->Request received for " + filename + " stat=" + stat);
          response.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': stat.size
           });
           var readStream = fs.createReadStream(filename);
           util.pump(readStream, response);
       } else {
         response.writeHead(404);
         response.end();    
       }
     });
   }
}

http.createServer(onRequest).listen(8888);

console.log("Server has started.");
