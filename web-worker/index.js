var w = new Worker("worker.js");

w.postMessage({type: 'requestId'});

w.onmessage = function(e){
  switch (e.data.type) {
    case 'requestId':
      document.getElementById("result").innerHTML = e.data.value  ;
      break;
    default:
      return;
  }
  // document.getElementById("result").innerHTML = e.data;
};