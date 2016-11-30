// var i = 0;
// 
// function timedCount() {
//     i = i + 1;
//     postMessage(i);
//     setTimeout("timedCount()",500);
// }
// 
// timedCount();

var ids = [];

function requestId() {
  return (new Date()).getTime();
}

onmessage = function(e) {
  switch (e.data.type) {
    case 'requestId':
      var id = requestId();
      ids.push(id);
      postMessage({type: 'requestId', value: id});
      break;
    default:
      return;
  }
}
