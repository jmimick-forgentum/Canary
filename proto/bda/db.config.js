/*
* db.config.js
* stores config info for db objects
*/

db = function () {
  return {
    url : "bda",
    collections : {
      index : { _id : '', m_id : '', value : '', address : '' },
      dat : {  _id : '', value : '' },
      map : {  _id : '', address : '', concept : ''}
    } 
  };
}
//exports.db = db;

