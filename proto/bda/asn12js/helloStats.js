/*
Concepts db - let's try to pull some stats!
  1 - find out how often each concept appears in the corpsus
*/


Array.prototype.merge = function(/* variable number of arrays */){
    for(var i = 0; i < arguments.length; i++){
        var array = arguments[i];
        for(var j = 0; j < array.length; j++){
            if(this.indexOf(array[j]) === -1) {
                this.push(array[j]);
            }
        }
    }
    return this;
};

console.time('helloStats');
var util = require('util');
var db = require('mongojs');
var ANDnotOR = true;
debugger;
if ( process.argv.length>2 ) {

	var search = process.argv.slice(2); //.join();
	if ( process.argv[2]==='OR' ) {
		ANDnotOR = false;
		search = process.argv.slice(3);
	}
	console.log('search='+util.inspect(search));
	conceptSearch(search);
} else {
	conceptOccurance();
}


function jsonConceptSearch(term, response) {
	console.log('jsonConceptSearch ---> term='+term);
	var result = [];
	var cdb = db.connect('concepts', ['ncidref']);
	var query = constructQuery(term,true);
	cdb.ncidref.find( query, function(err, items) {
		response.write( JSON.stringify(items) );
		response.end();
	
	});

	//result[0] = { id: 1, label: "one", value: "one "};
	//result.push()
	
}
exports.jsonConceptSearch = jsonConceptSearch;


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

function conceptSearch(search) {
	var cdb = db.connect('concepts', ['corpus', 'ncidref']);
	// find the ncids which contain the search terms in the desc
	var ncids = [];	// going to build an array of matching ncids;
	var orClause = []
	for(var i=0; i<search.length; i++) {
		orClause.push( { description : { $regex : search[i], $options: 'i' } });
	}

	var query = { $and : orClause };
	if ( !ANDnotOR ) {
		query = { $or : orClause };
	}
	//query = { description : { $or : search }};
	console.log( util.inspect(query,showHidden=true, depth=100, colorize=true));
	//for(var i=0; i<search.length; i++) {
		//cdb.ncidref.find( { description: { $regex : search[i], $options: 'i' } }).forEach( function(err,ncid) {
		//	if ( !ncid ) { return; }
		//});
		cdb.ncidref.find( query ).forEach( function(err,ncid) {
			if ( !ncid ) {
				console.log('Found '+ncids.length+' concepts matching query.'); 
				for(var i=0; i<ncids.length; i++) {
					//console.log(ncids[i].ncid + ' ' + ncids[i].description);
				}
				findCorpusHits(cdb,ncids);
				//cdb.close();
				return; 
			}
			//console.dir(ncid);
				
			ncids.push(ncid);
		});

	//}
}

function findCorpusHits(db, ncids) {
	var conceptCount = ncids.length;
	var conceptsVisited = 0;
	var encounters = [];
	var enc2concept = {};
	var enc2conceptHuman = {};
	ncids.forEach( function(ncid) {

		db.corpus.distinct( 'hemsEncId', {ncid: ncid.ncid}, function(err,items) {
			debugger;	
			conceptsVisited++;
		if ( items.length===0 ) { return; /* don't care about concepts with no visits*/}
			encounters.push( items );
			enc2concept[ncid.ncid] = items;
			enc2conceptHuman[ncid.description.join()] = items.length;
			//console.log('Found '+items.length+' distinct encounters with ncid=' + ncid.description);
			process.stdout.write('.');
			if ( conceptsVisited===conceptCount) {
				//consolidateEncounterHitData(encounters);				
				console.log('Search done... merging output...');
				var consolidatedEncounters = [];
				for(var i=0; i<encounters.length; i++) {
					consolidatedEncounters.merge(encounters[i]);
				}

				console.log('Found ' + consolidatedEncounters.length + ' encounters.');
				console.dir(enc2conceptHuman);
				console.timeEnd('helloStats');
				db.close();
			}
		});


	// 	db.corpus.find( {ncid: ncid.ncid}).count( function(err,count) {
	// 		conceptsVisited=conceptsVisited+1;

	// 		var msg = "("+conceptsVisited+")Concept[" + ncid.ncid + "] ("+ncid.description+")";
	// 		msg += "occurs in " + count + " corpus records.";
	// 		console.log( msg );
	// 		// need to find visit count
	// 		if ( conceptsVisited===conceptCount ) {
	// 			debugger;
	// 			db.close();
	// 		}
	// 	});
	// });
	});
}

function consolidateEncounterHitData() {
	//var arguments = encounters;
	var x = [];
	for(var i = 0; i < arguments.length; i++){
        var array = arguments[i];
        for(var j = 0; j < array.length; j++){
            if(x.indexOf(array[j]) === -1) {
                x.push(array[j]);
            }
        }
    }
    console.dir(x);
}

function conceptOccurance() {

	var cdb = db.connect('concepts', ['corpus', 'ncidref']);
	var popSize = 0;
	cdb.corpus.find().count( function(err, count) {
		if ( err ) { console.error(err) ;}
		popSize = count;
		console.log("Population size=" + popSize);
	});

	var conceptCount = 0;
	var conceptsVisited = 0;
	cdb.ncidref.find().count( function(err, count) {
		if ( err ) { console.error(err) ;}
		conceptCount = count;
		console.log("Concept population size=" + conceptCount);
	});

	cdb.ncidref.find().forEach( function(err, ncid) {
			if ( !ncid ) { 
				return;
			}
			
			cdb.corpus.find( {ncid: ncid.ncid}).count( function(err,count) {
					conceptsVisited=conceptsVisited+1;

					console.log( "("+conceptsVisited+")Concept[" + ncid.ncid + "] ("+ncid.description+") occurs in " + count/popSize + "% of the population.")
					if ( conceptsVisited===conceptCount ) {
						debugger;
						console.timeEnd('helloStats');
						cdb.close();
					}
			});
	});
}

