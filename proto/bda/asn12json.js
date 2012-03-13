var fs = require('fs');
var dir = process.argv[2];
/*console.log('dir='+dir);
fs.readdir(dir, function(err, files) {
	if (err) {
		console.log(err);
		return;
  	}
	for (var i=0; i<files.length; i++) {
		//console.log(files[i]);
		processASN1(dir+files[i]); 
	}
});
*/
processASN1('/Users/jasonmimick/dev/fogentum-jim-stuff/eventstuff/2981329.out');
function processASN1(fileName) {
	var file = fs.readFile(fileName,'utf8',function(err,fd) {
		if (err) {
      			console.error(err);
      			return;
		} else {
			var lines = fd.toString().trim().split(/\r|\n/);
			for(var i=0; i<lines.length; i++) {
				var IN_COMMENT = false;
				var words = lines[i].trim().split(' ');
				for(var j=0; j<words.length; j++) {
					if ( words[j]==='{' ) {
						console.log(":" + words[j]);
						continue;
					}
					if ( words[j].match("^}") ) {
						console.log(words[j]);
						continue;
					}
					if ( words[j].match("^<") ) {
						continue;
					}
					if ( IN_COMMENT && words[j].match("^--") ) 
					{
						IN_COMMENT = false;
						continue;
					}
					if ( IN_COMMENT ) { continue; }
					if ( words[j].match("^--") ) {
						IN_COMMENT = true;
						continue;
					}
					if ( words[j].match(",$") ) {
						console.log(': "' + words[j].slice(0,words[j].length-1) + '" ,');
						continue;
	
					}
					console.log('"' + words[j] + '"');
					//console.log('words['+j+"]="+words[j]);
				}	
			}
		}
	});
}
