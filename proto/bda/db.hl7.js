/*
* db.index.hl7.js
* data drive to load hl7 into the index file.
*/
var msgDir = "/Users/jasonmimick/Downloads/a31/";
var fs = require('fs');
var util = require('util');
var mongojs = require('mongojs');
require('./db.config.js');
var MessageCount = 0;
var MessageCounter = 0;
fs.readdir(msgDir, function (err, files) {
  if (err) {
    console.log(err);
    return;
  }
  debugger;
  var mdb = mongojs.connect(db().url,['index','dat']);
  console.log(util.inspect(mdb));
  MessageCount = files.length;
  for(var i=0; i<files.length; i++ ) { 
    readMsg(msgDir+files[i],mdb);
  }
  console.log("Done reading HL7 files");
  return;
});

function readMsg(msg,mdb) {
  var file = fs.readFile(msg,'utf8',function(err,fd) {
    if (err) {
      console.error(err);
      return;
    } else {
      var segs = fd.toString().trim().split(/\r|\n/);
      var om = {};
      for(var i=0; i<segs.length; i++ ) {
        var p = segs[i].split(/\|/);
        om[p[0]]=p.slice(1,p.length);
      }
      loadMessageIntoDat(om,mdb);
    }
  });
}
function loadMessageIntoDat(msg,mdb) {
  var m = db().collections.dat;
  m.value = msg;
  //console.log(util.inspect(m));
  mdb.dat.save(m, function(err, saved) {
    if ( err || !saved ) { 
      console.log("Error - could not save " + m + err);
    } else {
      console.log('Saved msg id='+m._id);
      loadMessageIntoIndex(m._id,msg,mdb,MessageCounter++);
    }
  });
  
}
function checkToCloseDb(msgCount,mdb) 
{
  console.log("chekToCloseDB msgCount="+msgCount+ " MessageCounter="+MessageCounter + " MessageCount="+MessageCount)
  if ( msgCount == (MessageCount-1) ) {
    console.log("Got signal to close db");
    mdb.close();
  }
}
function loadMessageIntoIndex(id, msg,mdb,msgCnt)
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
        } 
        
      });
    }
  }
  checkToCloseDb(msgCnt,mdb);
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
