var util = require('util');
var path = require('path');
var fs = require('fs');
var mongojs = require('mongojs');


var db = 'concepts';
var colls = [ 'corpus', 'ncidref'];

//var BATCH_DONE = false;
var ncidref = {};

/*
	Better - idea - just parse out the concepts from the messages.
	Build data set with corpus|hemsEncId --> ncid --> msgid
	X-ref with ncid db: ncidref|desc (since we have the long human version in messages)

	corpus {
		hemsEncId : <number>,
		ncid : <number>,
		msg_id: <message filename containing reference>
	}
	ncidref {
		ncid : <number>,
		description: <string>
	}
	Input - asn1 file, ncidref object (to build up)
	Output - array of corpus - corpi
*/
function CrunchMessage(fileName,fileLines, ncidref) {
	var hemsEncId = null;
	var corpi = [];
	var cur_ncids = {}; // we don't need to record dup ncids DO WE?
	for(var i=0; i<fileLines.length; i++) {
		// 1 find hemsEncId - there will not be any useful data until we hit that line
		var line = fileLines[i].trim();
		if ( line.indexOf('hemsEncId')==-1 && !hemsEncId) {
			continue;
		}
		//debugger;
		if (!hemsEncId) {
			hemsEncId = line.split(' ')[1].split(',')[0];
		}
		if ( line.indexOf('ncid')!=-1 ) {
			var p = line.split(' ');
			var ncid = p[1];
			if ( !cur_ncids[ncid] ) {
				cur_ncids[ncid]=1;
			} else {
				cur_ncids[ncid]++;
			}
			corpi.push( { hemsEncId: hemsEncId, ncid: ncid, count: cur_ncids[ncid], msgid: fileName });
			
			var desc = p.slice(2);
			var j=0; // remove '--' from desc
			while ( j<desc.length) {
				if ( desc[j]==='--') {
					desc.splice(j,1);
				} else {
					j++;
				}
			}
			if ( !ncidref[ncid] ) {
				ncidref[ncid] = { ncid: ncid, description: desc, count : 0 };
			} else if ( ncidref[ncid] && (ncidref[ncid].description.join() != desc.join()) ) {
				// this case means we hit this ncid already, but now a different 
				// description
				//console.log( ncid + ' but different desc' + util.inspect(ncidref[ncid]));
				ncidref[ncid].description.push(desc);
				//console.log( ncid + ' after ' + util.inspect(ncidref[ncid]));
			} else {
				//console.log( ncid + ' was already in the cache');
			}
			ncidref[ncid].count++;
		}
	}
	return corpi;
}



exports.readASN1Message = function (data, fn) {
	var conceptsDB = mongojs.connect( db, colls );
	debugger;
	var c = data.split('\n');
	var corpi = CrunchMessage(fn,c,ncidref);
	//console.log( dat + ' found ' + corpi.length + ' concepts');
	//console.log( 'There are ' + Object.keys(ncidref).length + ' concepts in the xref');
	//console.log(util.inspect(conceptsDB.corpus));
	//debugger;
	for (var i=0; i<corpi.length; i++) {
		//console.log(util.inspect( corpi[i] ));
		//debugger;
		var c = corpi[i];
		conceptsDB.corpus.save(c, function(err, saved) {
			debugger;
	    	if ( err || !saved ) { 
				console.log("Error - could not save " + c + err);
	    	} else {
	    		console.log('Saved corpi id='+saved._id);
	    		}
	  	});
	}
	conceptsDB.close();
}


