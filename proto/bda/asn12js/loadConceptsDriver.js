var lcm = require('./LoadConceptsModule.js');
var mongojs = require('mongojs');

var db = 'concepts';
var colls = [ 'corpus', 'ncidref'];

// Read all the files in the folder in sequence, using callbacks
    var fs = require("fs");
    var dir = process.argv[2];
    if ( process.argv[1]==='debug') { dir = process.argv[3]; }
    fs.readdir( dir, function( error, files ) {
        if ( error ) {
            console.log("Error listing file contents.");
        } else {
            var conceptsDB = mongojs.connect( db, colls );
        
            // This function repeatedly calls itself until the files are all read.
            var readFiles = function(index) {
                if ( index == files.length ) {
                    // we are done.
                    //lcm.saveNcidRef(conceptsDB);
                    conceptsDB.close();

                } else {
                    
                    fs.readFile( dir + files[index], 'utf-8', function( error, data ) {
                        if ( error ) {
                            console.error( "Error reading file. ", error );
                        } else {
                            lcm.readASN1Message(data,files[index], conceptsDB);
                            process.stdout.write('+');    
                            readFiles(index + 1);
                        }
                    });
                }

            };

            readFiles(0);
        }
    });