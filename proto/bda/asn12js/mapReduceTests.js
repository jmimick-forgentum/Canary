
db.junk.drop();


var map = function () {
		// return count=1 to just count how many concepts
	  // return count = this.count to return the number of concepts along with how many times they occur
    emit(this.ncid, { count : /*1*/this.count });
}

var reduce = function (k, vals) {
  var count = 0;
  //vals.forEach(printjson);
	vals.forEach(function (v) {count+=v['count'];});
  return { /*ncid:k,*/ count: count };
	//return {ncid:k, vals : vals.join() };
}

var r1 = db.corpus.mapReduce(map,reduce, {out: 'junk'})
printjson(r1);
//db.junk.find().forEach(printjson);;

//db.junk.find({"value.count" : { $gt : 100 }}).forEach(printjson);
db.junk.find().sort({"value.count" : -1}).limit(10).forEach(printjson);

// now map over junk to see how many concepts we count - it should equal
// db.corpus.count();
/*
db.junk.group(
{
 initial: {sum: 0}, 
 reduce: function(doc, prev) { prev.sum += doc['value.count']; }
}).forEach(printjson);
*/
/**/
var map2 = function() {
	emit(1, { count : this.value.count });
}
var reduce2 = function(k,vals) {
	var count = 0;
	//vals.forEach(printjson);
  vals.forEach( function(v) { count+= v['count']; } );
	return { count : count };
}

var r = db.junk.mapReduce(map2,reduce2, { out: {inline:1} });
printjson(r);
/* */

