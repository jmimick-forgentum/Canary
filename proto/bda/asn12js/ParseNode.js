function ParseNode(parent,name,value) {
	if ( value.match("^{") ) {
		value = ParseNode(this, 1, value);
	}
	var node = {
		Parent : parent,
		Name : name,
		Value : value
	};
	return node;
}
var util = require('util');
var path = require('path');
var fs = require('fs');

var debugFn = function(t,d) {
	console.log( util.inspect(t) + '\nd='+d);
}
var JSON = '';
var Trans = {
	Name : function(d) {
		JSON += d + ":";
	},
	Value : function(d) {
		JSON += "'"+d+"'";
	},
	Name2Value : function(d) {
		JSON += d + ":"	
		debugFn('Name2Value',d);	
	},
	Name2Start : function(d) {
		JSON += d + ' ';
			debugFn('Name2Start',d);
	},
	Value2End : function(d) {
		JSON += d + ' ';
			debugFn('Value2End',d);
	},
	Value2Comma : function(d) {
		JSON += d;
			debugFn('Value2Comma',d);
	},
	Comma2Name : function(d) {
		JSON += '\n' + d + ":";
			debugFn('Comma2Name',d);
	},
	Start2Name : function(d) {
		JSON += d + ':';
			debugFn('Start2Name',d);
	},
	Start2Start : function(d) {
		JSON += '[';
			debugFn('Start2Start',d);
	},
	End2End : function(d) {
		JSON += ']'
			debugFn('End2End',d);
	},
	End2Comma : function(d) {
		JSON += d; 
			debugFn('End2Comma',d);
	},
	End2Done : function(d) {
			debugFn('End2Done',d);
	}
};

var StateMachine = {
	States : [ 'Name', 'Value', 'Comma', 'Start', 'End' ],
	Name : { Name: Trans.Name, Value : Trans.Name2Value, Start : Trans.Name2Start },
	Value : { Value : Trans.Value, End : Trans.Value2End, Comma : Trans.Value2Comma },
	Comma : { Name : Trans.Comma2Name },
        Start : { Name : Trans.Start2Name, Start : Trans.Start2Start },
	End : { End : Trans.End2End, Comman : Trans.End2Comma, Done : Trans.End2Done },

	InspectToken : function(token,currentState) {
		var prev = token[0], cur = token[1], next = token[2];
		if ( cur==='{' ) {
			if ( currentState===StateMachine.Start ) {
				return [StateMachine.Start,StateMachine.Start.Start];
			}
			return [StateMachine.Name,StateMachine.Start.Name];
		}
		if ( token==='}') {
			if ( currentState===StateMachine.End ) {
				return [StateMachine.End,StateMachine.End.End];
			}
			return [StateMachine.End,StateMachine.End.Done];
		}
		if ( token===',' && currentState===StateMachine.Value) {
			return [StateMachine.Name,StateMachine.Comma.Name];
		}
		// if here, then we have some string ---
		if ( currentState===StateMachine.Name ) {
			return [StateMachine.Value, StateMachine.Value.Value];
		}
		if ( currentState===StateMachine.Start ) {
			return [StateMachine.Name,StateMachine.Name.Name];
		}
		return [StateMachine.Name, StateMachine.Name.Name];
	}
};

//console.log( util.inspect(StateMachine) );


var dat = path.normalize(process.cwd()+'/sampleData.asn1');
var f = /*"/small.txt";//*/ "/2985458.out";
dat = path.normalize('/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff' + f);
var dir ='/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff/';
//var files = loadDirectory(dir,addFile);

var files = fs.readdirSync(dir);
//console.log(files);
//debugger;
var BATCH_SIZE = 100;
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
	console.log("Reading batch i=" + i); //util.inspect(batch));
	readMessage(batch, ncidref, true); //,mdb);
	//while ( !BATCH_DONE ) {}
	//debugger;
}
console.log( util.inspect(ncidref) );
/*
files.forEach( function(file) {
	  		if ( file.indexOf('.out') == -1 ) return;
	    	readMessage(dir+file); //,mdb);
});
*/
function loadDirectory(dir,fn) {
	fs.readdir(dir, function (err, files) {
  		if (err) {
    		console.log('loadDirectory--'+err);
	    	return;
	  	}
	  	//var mdb = mongojs.connect(db().url,['index','dat']);
	  	//console.log(util.inspect(mdb));
	  	//MessageCount = files.length;
	  	//for(var i=0; i<files.length; i++ ) { 
	  	//files.forEach( function(file) {
	  	//	if ( file.indexOf('.out') == -1 ) return;
	    //	readMessage(dir+file); //,mdb);
	  	//});
	  	//console.log("Done.");
	  	fn(files);
	  	return files;
	});
}

function readMessage(batch,ncidref,trueForASync) {

	if (!trueForASync) {
		batch.forEach( function(dat) {
			var fd = fs.readFileSync(dat,'utf8');
			var c = fd.split('\n');
			var corpi = CrunchMessage(dat,c,ncidref);
			console.log( dat + ' found ' + corpi.length + ' concepts');
			console.log( 'There are ' + Object.keys(ncidref).length + ' concepts in the xref');
			//console.log( 'corpi='+util.inspect(corpi,  showHidden=true, depth=100, colorize=true) );
			//console.log( 'ncidref='+util.inspect(ncidref,  showHidden=true, depth=100, colorize=true) );
		});
	} else {
		batch.forEach( function(dat) {
			fs.readFile(dat,'utf8',function(err,fd) {
		    	if (err) {
		      		console.error('readMessage--'+err);
		      		debugger;
		      		return;
		    	} else {
					var c = fd.split('\n');
					var corpi = CrunchMessage(dat,c,ncidref);
					console.log( dat + ' found ' + corpi.length + ' concepts');
					console.log( 'There are ' + Object.keys(ncidref).length + ' concepts in the xref');
				}
			});
		});
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
		debugger;
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

function parseASN1(curObj,asn1Lines,lineCntr) {
	var shouldWork = true;
	while ( shouldWork ) {
		//debugger;
		//console.log('parseASN1 lineCntr='+lineCntr);
		var line = asn1Lines[lineCntr];
                if ( !line ) { shouldWork = false; continue; }
		if ( line.trim()==="}"  ) {
			// end of this object - 
			//shouldWork = false;
		    if (( lineCntr+1 ) == asn1Lines.length) shouldWork = false;
			lineCntr++;
			//console.log('continue 1');
			continue;
		}
		if ( line.trim()==="}," ) {
			debugger;
			shouldWork = false; // end
			lineCntr++;
			//console.log('continue 2');
			//continue;
			return [curObj, lineCntr];
		}
		if ( line.trim()==="{" ) {
			//console.log("<<<<<< first case line.trim()==='{'");
			curObj.___ac = curObj.___ac ? curObj.___ac++ : 1;
			//curObj['___'+curObj.___ac] = {};
			var result = parseASN1({},asn1Lines,lineCntr+1);
			lineCntr = result[1] + 1;;	
			//curObj['___'+curObj.___ac]= result[0]; 
			curObj = result[0]; 
			//shouldWork = false;
			//lineCntr++;
			//console.log('continue 3');
			continue;
		}
		if ( line.indexOf('{') > 0 ) {
			//debugger;
			var name = line.trim().split('{')[0];
			name = name.replace(/\s/g,'_');
			name = name.replace(/</g,'_');
			name = name.replace(/>/g,'_');
			//curObj[name] = {};
			var result = parseASN1( {}, asn1Lines, lineCntr+1 );
			curObj[name] = result[0]; 
			//shouldWork = false;
			lineCntr = result[1] ;
			//console.log('continue 4');
			continue;
		}
		var tline = line.trim();
		if ( tline.split(' ').length === 1 ) {
			//var result =  parseASN1( {}, asn1Lines, lineCntr+1 );
			//curObj[ tline ] = result[0]; 
			//lineCntr= result[1]+1;
			//console.log('continue 5');
			lineCntr++;
			continue;
		}
		var fsp = tline.indexOf(' ');
		var name = tline.slice(0,fsp);
		//console.log('name='+name);
		//console.log( 'curObj=' + util.inspect(curObj) );
		curObj[ name ] = tline.slice(fsp+1,tline.length);
		if (( lineCntr+1 ) == asn1Lines.length) shouldWork = false;
		lineCntr++;
	}
	console.log( 'curObj=' + util.inspect( curObj ) + ' lineCntr='+ lineCntr);
	
	return [curObj,lineCntr];
}

//var w = sample.split(' ')[0];

//var tn = ParseNode(null, w, sample.slice(sample.indexOf('{'),sample.length));

//console.log( util.inspect(tn) );
