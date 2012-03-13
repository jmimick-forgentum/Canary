var lcm = require('./LoadConceptsModule.js');

// Read all the files in the folder in sequence, using callbacks
    var fs = require("fs");
    var dir = process.argv[2];
    fs.readdir( dir, function( error, files ) {
        if ( error ) {
            console.log("Error listing file contents.");
        } else {
            var totalBytes = 0;

            // This function repeatedly calls itself until the files are all read.
            var readFiles = function(index) {
                if ( index == files.length ) {
                    // we are done.
                    console.log( "Done reading files. totalBytes = " + 
                        totalBytes );
                } else {
                    console.log('file=' + dir + files[index]);    
                    fs.readFile( dir + files[index], 'utf-8', function( error, data ) {
                        if ( error ) {
                            console.log( "Error reading file. ", error );
                        } else {
                            totalBytes += data.length;
                            debugger;
                            lcm.readASN1Message(data,files[index]);
                            readFiles(index + 1);
                        }
                    });
                }

            };

            readFiles(0);
        }
    });