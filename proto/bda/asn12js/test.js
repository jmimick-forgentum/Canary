var cs = require('./canarySearch.js');

function testPowerSet() {
	var p = [1,2,3];
	var pwr = cs.powerSet(p);
	console.log(p);
	console.log(pwr);

	p = [ 'a', 'b', 'c', 'd'];
	pwr = cs.powerSet(p,true);
	console.log(p);
	console.log(pwr);

	p = [ 'apple', 'cherry', 'lemon', 'strawberry'];
	pwr = cs.powerSet(p);
	console.log(p);
	console.log(pwr);

	p = [0,1,2,3,4,5,6,7,8,9,10];
	pwr = cs.powerSet(p);
	console.log(p);
	console.dir(pwr);
	console.log(pwr.length);
}

function testEncPwrSearch() {
	var concepts = [];
	//concepts.push( { "_id" : 1029, "value" : { "count" : 193464 } });
	//concepts.push({  "_id" : 1048021, "value" : { "count" : 67214 } });
	//concepts.push( { "_id" : 1505, "value" : { "count" : 60573 } });
 	//concepts.push( { "_id" : 1049621, "value" : { "count" : 47877 } });
	//concepts.push( { "_id" : 67670, "value" : { "count" : 27177 } });
	//concepts.push( { "_id" : 41200000, "value" : { "count" : 21235 } });
	//concepts.push( { "_id" : 1518, "value" : { "count" : 18179 } });
	concepts.push( { "_id" : 1140, "value" : { "count" : 13861 } });
	concepts.push( { "_id" : 54348, "value" : { "count" : 12776 } });
	concepts.push( { "_id" : 216, "value" : { "count" : 11587 } });
	var ids = [];
  concepts.forEach( function(c) { ids.push( c['_id'] ); } );
	console.dir(concepts);
	console.dir(ids);

	var cs = require('./canarySearch.js');


  cs.encPwrConcept( ids, process.stdout );	
}

testEncPwrSearch();

