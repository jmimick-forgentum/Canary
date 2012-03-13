var ui = {
  RESULT_BANNER : 'Found <strong>#</strong> results in (<strong>@</strong> seconds)',
  load : function() {
    $('#resultsMeta').append(ui.RESULT_BANNER).fadeIn("slow");
    var t = document.createElement('table')
    t.appendChild(getLinksHeaderRow()) 
    //get('smith', function(d) { addQResult(t,d)} );
    //get('stone', function(d) { addQResult(t,d)} ); //,xx);
    $('#links').append(t);
    $('#query').change(function() {
      //alert('Handler for .change() called.');
      //alert( $('#query').val() );      
      get( '+q', $('#query').val(), function(d) { 
        $(t).empty();
        addQResult(t,d); } );
    });

    /*$( "#dialog-message" ).dialog({
      modal: true,
      buttons: {
        Ok: function() {
          $( this ).dialog( "close" );
        }
      }
    });*/
  }
};
function addQResult(t,rs) {
  // rs.length-1 since the server returns empty last object to deal with last ,(comma) in array
  for (var i=0; i<(rs.length-1); i++) {
    //alert(JSON.stringify(rs[i]));
    t.appendChild( getLinkRow( rs[i] ) );
  }
}

function popD(msg) {
  $("#dialog-detail").text(msg);
  $("#dialog-detail").dialog({
    modal: true,
    buttons : {
      Close: function() {
        $( this ).dialog( "close" );
      }
    }
  });
}

function getLinksHeaderRow() {
  var tr = document.createElement('tr');
  tr.className = 'linkHeader';
  var props = [ '_id', 'mid', 'value', 'address' ];
  for(var i = 0; i< props.length; i++) {
    var th = document.createElement('th');
    th.appendChild( document.createTextNode( props[i] ) );
    tr.appendChild(th);
  }
  return tr;
}

function getLinkRow(indexEntry)
{
  var tr = document.createElement('tr');
  tr.className = 'link';
  var props = [ '_id', 'm_id', 'value', 'address' ];
  for(var i = 0; i< props.length; i++) {
    var td = document.createElement('td');
    td.appendChild( document.createTextNode( indexEntry[props[i]] ) );
    tr.appendChild(td);
  }
  //var ltd = document.createElement('td');
  //var l = document.createElement('a');
  //$(l).text('Link');
  //$(l).click(function() { get('+d', indexEntry['m_id'], function(d) { popD(JSON.stringify(d)) }); });
  //$(l).href = '#';
  //$(ltd).append( l );
  //$(tr).append(ltd);
  $(tr).click(function() { get('+d', indexEntry['m_id'], function(d) { popD(JSON.stringify(d)) }); });
  //$(l).href = '#';
  return tr;
}

function getJ(q) {
  alert('getJ q='+q);
  $.getJSON('http://localhost:8888/q/'+q,null, function(data) {
    alert('got jsonP ' + data);
  });
}

function get(op, id, callback) {
    $.ajax('http://localhost:8888/'+op+'/' + id , {
       type: 'GET',
       dataType: 'json',
       success: function(data) { if ( callback ) callback(data); },
       error  : function(jqXHR, textStatus, errorThrown) {
           alert('textStatus='+textStatus);
       }
    }
);
}

function xx(data) {
  alert(data);
  $('#links').append(data);
  
}


