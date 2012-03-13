require('./db.config.js');
var mongojs = require('mongojs');
var util = require('util');
var mdb = mongojs.connect(db().url,['index','dat']);
var query = function(term,response) {
    var qstr = new RegExp(term,'i');
    console.log('query('+term+')');
    response.write('[');	// start array
    mdb.index.find({'value':qstr}).forEach(function(err, doc) {
      if (err) console.log(err.message);
      if (!doc) {
        // we visited all docs in the collection
        console.log("query - calling response.end()");
        response.end('{}]\n');
        return;
      } else {
        // doc is a document in the collection    
        //console.log( JSON.stringify(doc) );
        response.write( JSON.stringify(doc) );
        response.write(',');
      }
    });                
};

var detail = function(id, response) {
  console.log('detail('+id+')');
  mdb.dat.findOne({'_id': mdb.ObjectId(id)}, function(error, result) {
    if( error ) {
      console.log('detail - error='+error);
    } else {
      //console.log('detail - result='+util.inspect(result));
      response.write( JSON.stringify(result) );
      response.end();
    }
   });
};

module.exports.query = query;
module.exports.details = detail;

var test = function() {
  //console.log(util.inspect(process.stdout)); 
  query('SMITH', process.stdout);
  query('stone', process.stdout);
};

module.exports.queryTest = test;

//test();

