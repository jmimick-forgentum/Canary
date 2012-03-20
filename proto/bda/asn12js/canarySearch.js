// canary search - json module

var util = require('util');
var db = require('mongojs');
require('../fjsutil.js');

function convertNcidrefToSearchResult(n) {
	var r = {};
	r.id = n.ncid;
	r.label = r.value = n.description.join(' ');
	return r;
}

function jsonConceptSearch(term, response) {
	console.log('jsonConceptSearch ---> term='+term);
	var result = [];
	var cdb = db.connect('concepts', ['ncidref']);
	if ( term.indexOf(',')>0 ) {
		term = term.split(',');
	} else {
		term = [ term ];	// TO-DO - support multiple search terms!
	}
	var query = constructQuery(term,true);
	console.log( util.inspect(query,showHidden=true, depth=100, colorize=true));
	cdb.ncidref.find( query, function(err, items) {
		for(var i=0; i<items.length; i++) {
			result.push( convertNcidrefToSearchResult(items[i]));	
		}
		response.write( JSON.stringify(result) );
		cdb.close();
		response.end();
	
	});

	//result[0] = { id: 1, label: "one", value: "one "};
	//result.push()
	
}

function encPwrConcept(concepts,response) {
	if ( !(concepts instanceof Array) ) {
		concepts = concepts.split(',');
	}
  var pc = powerSet(concepts);
	var encounters = [];
	var numTimesCallback = 0;
  for(var i=1; i<pc.length; i++ ) {
		var subset = pc[i].join();
	  var enc = jsonEncounterWithNcidSearch(subset,null,function(enc,j,done){
			console.log('encPwrConcept - callback enc='+enc+' j='+j+' pc[j]='+pc[j]);
    	encounters.push( { concepts : pc[j], encounters : enc } );
			numTimesCallback++;
			//if ( j===(pc.length-1)) { 	// at end 
			if ( numTimesCallback === (pc.length-1) ) {
				debugger;
				console.log('encPwrConcepts----');console.dir( encounters );
	
				response.write( JSON.stringify( encounters ) );
				response.end();

			}
			}, [i,pc.length-1], function() {
				console.log('encPwrConcepts----');console.dir( encounters );
				response.write( JSON.stringify( encounters ) );
				response.end();
			} /*true to end response*/);
	}
}

// given a [concept id] - return a json object representing the encounters
// which contain a reference to the concept
function jsonEncounterWithNcidSearch(inNcid, response, optCallback, lastCall, lastCallFn) {

	var ncids = [ inNcid ]; // TO-DO - support multiple concept ids
	if ( inNcid.indexOf(',')>0 ) {
		ncids = inNcid.split(',');
	}
	console.log('jsonEncounterWithNcidSearch--->ncid='+ncids+' l='+ncids.length + ' lastCall='+lastCall);
	var conceptsVisited = 0;
	var encounters = [];
	var cdb = db.connect('concepts', ['corpus']);
	
	// return total # of encounters ----
	cdb.corpus.distinct( 'hemsEncId', {}, function(err,items) {
		console.log('total # of encounters='+items.length);
		//console.dir(items);
		// first item in array is a count of encounters
		encounters.push([items.length]);

		//var msgLookup = {};
		ncids.forEach( function(ncid) {
			var q = { ncid: parseInt(ncid) };
			console.log('------ q ------');
			console.dir(q);
			cdb.corpus.distinct( 'hemsEncId', q, function(err,items) {
				console.dir(err);
				conceptsVisited++;
				//console.dir(items);
				if ( items.length===0 ) { return; /* don't care about concepts with no visits*/}
				encounters.push( items );
				if ( conceptsVisited===ncids.length) { // done - we can write out results.
					
					var consolidatedEncounters = [];
					for(var i=0; i<encounters.length; i++) {
						consolidatedEncounters.merge(encounters[i]);
					}
					console.log('found '+consolidatedEncounters.length+' encounter with concept='+ncids);
					if ( response ) {
						response.write( JSON.stringify( consolidatedEncounters ) );
					}

					cdb.close();
					if ( response ) {
						response.end();
					} else {
						if ( optCallback ) {
							optCallback(consolidatedEncounters.length, lastCall[0],(lastCall[0]===(lastCall[1]-1)));
						}
						//if ( (lastCall[0]===(lastCall[1]-1)) && lastCallFn ) { debugger; lastCallFn(); }
					}
				}
				
				
				
			});
		});
	});

}

// given an array of strings - return a mongodb query
function constructQuery(search, andNOTor) {
	var termClause = []
	for(var i=0; i<search.length; i++) {
		termClause.push( { description : { $regex : search[i], $options: 'i' } });
	}

	var query = { $and : termClause };
	if ( !andNOTor ) {
		query = { $or : termClause };
	}
	return query;
}

// given an array of n items -
// return an array containing the power set of the 
// input set - there are 2^|s| sets - 
// count from 0 to 2^|s|, get binary rep - for each binary
// number a 1 in slot i means the corresponding element from
// s is in the subset.
function powerSet(s, debug) {
	var power = [];
	var card = Math.pow(2,(s.length));
	var zeros = '';
	
	for(var i=0; i<s.length; i++) { zeros += '0'; }
	var negCard = parseInt('-'+s.length);
	for(var i=0; i<card; i++) {
		var b = (zeros + i.toString(2)).slice(negCard);
		var set = [];
		for(var j=0; j<b.length; j++) {
			if ( debug ) {
				console.log('i='+i+' j='+j + ' b=' + b);
			}
			if ( b[j]==='1' ) {
				set.push( s[j] );
			}
		}
		power.push(set);
		//console.log(b);
		//power.push( s.slice(i,(i+1)%s.length) );

	}
	console.log('powerSet---');console.dir(s);console.dir(power);
	return power;
}
exports.encPwrConcept= encPwrConcept;
exports.powerSet = powerSet;
exports.jsonConceptSearch = jsonConceptSearch;
exports.jsonEncounterWithNcidSearch = jsonEncounterWithNcidSearch;
