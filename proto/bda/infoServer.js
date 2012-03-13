var mongojs = require('mongojs');
var util = require('util');

var http = require("http");
var dburl = "patients";
var collection = "patients";
var db = mongojs.connect(dburl,['patients']);
var firstRow = true; // fix this
function onRequest(request, response) {
  console.log("Request received.");
  response.writeHead(200, {"Content-Type": "text/html"});
  //response.write("Hello World");
  db.index.find(function(err, ps) {
    if( err || !ps) {
      response.write("No patients found");
     } else {
       ps.forEach( function(p) {
         response.write('<table>');
         if ( firstRow ) {
  	   response.write(objToHtmlTableHeader(p));
           firstRow = true;
         }
  	 response.write(objToHtmlTableRow(p),false);
         response.write('</table>');
         //response.write(JSON.stringify(p));
       });
       response.end();
     }
  });  
}

http.createServer(onRequest).listen(8888);

console.log("Server has started.");
