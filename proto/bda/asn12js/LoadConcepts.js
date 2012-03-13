var util = require('util');
var path = require('path');
var fs = require('fs');
var mongojs = require('mongojs');



//var dat = path.normalize(process.cwd()+'/sampleData.asn1');
//var f = /*"/small.txt";//*/ "/2985458.out";
//dat = path.normalize('/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff' + f);
//dat = path.normalize('/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff' + f);
var dir ='/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff/'; //smallEstuff/';
//var files = loadDirectory(dir,addFile);

var files = fs.readdirSync(dir);
var db = 'concepts';
var colls = [ 'corpus', 'ncidref'];
//var conceptsDB = mongojs.connect( db, colls );
//conceptsDB.open();
//console.log( util.inspect( conceptsDB ) );
//return;

//console.log(files);
//debugger;
var BATCH_SIZE = 1;
//var BATCH_DONE = false;
var ncidref = {};
for(var i=0; i<files.length; i=i+BATCH_SIZE) {
	var end = i+BATCH_SIZE;
	if ( i+BATCH_SIZE > files.length ) {
		end = files.length;
	} 
	var start = i;
	var batch = files.slice(start,end);
	var j=0;
	while ( j<batch.length) {
		if ( batch[j].indexOf('.out') == -1) {
			batch.splice(j,1);
		} else {
			batch[j] = dir + batch[j];
			j++;
		}
	}
	//console.log("Reading batch i=" + i); //util.inspect(batch));
	readMessage(batch, ncidref); //, conceptsDB); //,mdb);
	//while ( !BATCH_DONE ) {}
	//debugger;
}
console.log("File loop done - here is ncidref");
console.log( util.inspect(ncidref) );
return;

function readMessage(batch,ncidref) {
	var conceptsDB = mongojs.connect( db, colls );
	for(var i=0; i<batch.length; i++) {
		//batch.forEach( function(dat) {
		var dat = batch[i];
			var fd = fs.readFileSync(dat,'utf8');
			var c = fd.split('\n');
			var corpi = CrunchMessage(dat,c,ncidref);
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
	    				return;
	    				//loadMessageIntoIndex(m._id,msg,mdb,MessageCounter++);
	    			}
	  			});
			}

			//console.log( 'corpi='+util.inspect(corpi,  showHidden=true, depth=100, colorize=true) );
			//console.log( 'ncidref='+util.inspect(ncidref,  showHidden=true, depth=100, colorize=true) );
	}
	conceptsDB.close();
		// batch.forEach( function(dat) {
		// 	fs.readFile(dat,'utf8',function(err,fd) {
		//     	if (err) {
		//       		console.error('readMessage--'+err);
		//       		debugger;
		//       		return;
		//     	} else {
		// 			var c = fd.split('\n');
		// 			var corpi = CrunchMessage(dat,c,ncidref);
		// 			console.log( dat + ' found ' + corpi.length + ' concepts');
		// 			console.log( 'There are ' + Object.keys(ncidref).length + ' concepts in the xref');
		// 		}
		// 	});
		// });
	
}


function checkToCloseDb(currentCount,maxCount,db) 
{
  //console.log("chekToCloseDB msgCount="+msgCount+ " MessageCounter="+MessageCounter + " MessageCount="+MessageCount)
  if ( currentCount == (maxCount-1) ) {
    console.log("Got signal to close db");
    db.close();
  }
}
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

