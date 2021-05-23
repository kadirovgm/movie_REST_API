function generate_request_guid() {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
  }

  return s4() + s4() + s4();
}

var clientUUID = generate_request_guid();

XhrInterceptor.addRequestCallback(function(xhr) {
  try {
      xhr.setRequestHeader('UUID', clientUUID + '#' + generate_request_guid());
      xhr.setRequestHeader('C-STARTED', Date.now());
  } catch (e) {
      console.log("Can't set request headers. Details:", e.error.toString());
  }
});



var logStore = [];
var urlForExclude = '';

XhrInterceptor.addResponseCallback(function(xhr) {
  try {
      var req_uuid = xhr.getResponseHeader('UUID');
      var req_started = xhr.getResponseHeader('C-STARTED');

      if (req_uuid && req_started && !xhr.responseURL.includes(urlForExclude)) {
          req_started = parseInt(req_started, 10);

          var s_total = parseFloat(xhr.getResponseHeader('REQUEST-TOTAL') || 0);

          var record = {
              'uuid': req_uuid,
              'c_total': Math.max(Date.now() - req_started, s_total, 0),
              'started': xhr.getResponseHeader('STARTED') || '',
              'path': xhr.getResponseHeader('PATH') || '',
              'total': s_total,
              'sql_count': parseInt(xhr.getResponseHeader('SQL-COUNT') || 0),
              'sql_total': parseFloat(xhr.getResponseHeader('SQL-TOTAL') || 0),
          };

          record['tr_total'] = (record['c_total'] - record['total']).toFixed(4);
          logStore.push(record);
      }

  } catch (e) {
      console.log("Can't process response. Details:", e.error.toString());
  }
});



// Подключаемся к запросам
XhrInterceptor.wire();

function startLogging(clientLogUrl, timeout = 10000) {
  function sendRequestStats() {
      if (logStore.length) {
          var log_part = JSON.stringify(logStore.slice());
          logStore = [];

          var xhttp = new XMLHttpRequest();
          xhttp.open("POST", clientLogUrl, true);
          xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhttp.send("logs=" + log_part);
      }
  }

  urlForExclude = clientLogUrl;
  setInterval(sendRequestStats, timeout);
}