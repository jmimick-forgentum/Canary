/*
* db.index.hl7.js
* data drive to load hl7 into the index file.
*/
var snomedDir = "/Users/jasonmimick/Downloads/Users/jasonmimick/Downloads/SnomedCT_Release_INT_20120131/RF2Release/Full/";
var fs = require('fs');
var util = require('util');
var mongojs = require('mongojs');
require('./db.config.js');
var mdb = mongojs.connect(db().url,['concept']);
console.log(util.inspect(mdb));
fs.readdir(msgDir, function (err, files) {
  if (err) {
    console.log(err);
    return;
  }
  //console.log(files);
  for(var i=0; i<files.length; i++ ) { 
    if ( i >= GOVENOR ) { 
      mdb.close();
      return; 
    }
    readMsg(msgDir+files[i]);
  }
  mdb.close();
});

function readMsg(msg) {
  var file = fs.readFile(msg,'utf8',function(err,fd) {
    if (err) {
      console.error(err);
      return;
    } else {
      var segs = fd.toString().trim().split(/\r|\n/);
      //console.error('segs.length='+segs.length);
      var om = {};
      for(var i=0; i<segs.length; i++ ) {
        //console.log("%s\r\n",segs[i]);
        //process.stdout.write(segs[i]+"\r\n");
	    //sleep(10);
        //console.log("\n----\nSeg %d %s\n----\n",i,segs[i]);
        var p = segs[i].split(/\|/);
        om[p[0]]=p.slice(1,p.length);
      }
      //var o4db = createDBObject(om);
      loadMessageIntoDat(om);
      //loadMessageIntoIndex(id,om);
      //console.log('Saved msg id='+id);




      //db.patients.save(o4db, function(err,saved) {
      // ( err || !saved ) console.log("User not saved:"+err);
      // else console.log("User saved");
      //});
      //console.log(util.inspect(o4db,true,null));
      //console.log('o4db='+o4db);
      //return o4db;
      
    }
  });
}
function loadMessageIntoDat(msg) {
  var m = db().collections.dat;
  m.value = msg;
  //console.log(util.inspect(m));
  mdb.dat.save(m, function(err, saved) {
    if ( err || !saved ) { 
      console.log("Error - could not save " + m + err);
    } else {
      console.log('Saved msg id='+m._id);
      loadMessageIntoIndex(m._id,msg);
    }
  });
  
}
function loadMessageIntoIndex(id, msg)
{
  for (seg in msg) {
    for (i in msg[seg]) {
      if ( msg[seg][i] === '' ) {
        continue;
      }
      var irow = db().collections.index;
      irow.value = msg[seg][i];
      irow.address = seg + '.' + i;
      irow.m_id = id;
      //console.log(util.inspect(irow));
      mdb.index.save(irow, function(err, saved) {
        if ( err || !saved ) { 
          console.log("Error - could not save " + irow);
        } else {
          console.log("Saved " + irow);
        }
      });
    }
  }
  debugger;
}
function createDBObject(msg) 
{
  //console.log(msg);
  var o = {};
  o.Meta = { 
    Event : msg.MSH[7], 
    When : msg.MSH[6],
    ControlID : msg.MSH[8],
    From : msg.MSH.slice(2,4) };
  o.Name = msg.PID[4];
  o.DateOfBith = msg.PID[6];
  o.Gender = msg.PID[7];
  var a = msg.PID[10].split(/\^/);
  o.Address = { Street : a[0], City : a[2], State:a[3],ZipCode:a[4] };
  o.Phones = { Home: msg.PID[12], Work: msg.PID[13] };
  o.Identifiers = [msg.PID[18]];
  o.Diagnosis = {};
  o.Diagnosis[msg.DG1[1]] = { Code: msg.DG1[2], Text: msg.DG1[3] };
  //o.Insurace = msg.IN1[1];
  return o;
}
