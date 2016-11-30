const store1 = [
  {text: 'root', value: '0', depth: 0, branch: true, leaf: false},
  {text: 'one a', value: '1', depth: 1, branch: true, leaf: false},
  {text: 'one one b', value: '1.1', depth: 2, branch: false, leaf: true},
  {text: 'two c', value: '2', depth: 1, branch: true, leaf: false},
  {text: 'two one d', value: '2.1', depth: 2, branch: false, leaf: true}
]

const store = {children: [
  {text: 'one a', value: '1', children: [
    {text: 'one one b', value: '1.1'}
  ]},
  {text: 'two c', value: '2', children: [
    {text: 'two one d', value: '2.1'}
  ]},
  {text: 'zzzz', value: '42'}
]};

var flatStore = [];
traverse(store).forEach(function(node) {
  if (node.hasOwnProperty('text') && node.hasOwnProperty('value')) {
    let level = this.level/2 - 1;
    let path = this.path.join('.')
    flatStore.push({text: node.text, value: node.value, level: level, path: path})
  }
});
console.log('flatStore', flatStore);

let pathMatch = '';
let regex = new RegExp('d', 'ig');
matchTree = flatStore.reverse().filter(function(node) {
  regex.lastIndex = 0;
  if (regex.test(node.text) || pathMatch.indexOf(node.path) > -1) {
    pathMatch = node.path;
    return true;
  }
}).reverse();
console.log('tree', matchTree);

// let treeObj = {};
// matchTree.forEach(function(node) {
//   path = node.path.split('.').map(function(p) {
//     let n = parseInt(p, 10);
//     if (isNaN(n)) {
//       return p;
//     } else {
//       return n;
//     }
//   });
//   delete node.path;
//   delete node.level;
//   
//   children = path.reduce(function(previousValue, currentValue, currentIndex, array) {
//     if (currentIndex === 0) {
//       obj = {};
//     }
//     if (typeof previousValue === 'string') {
//       previousValue = []
//     }
//     return previousValue[currentValue] = node;
//   });
//   debugger
// })

// function isBranch(item, store) {
//   if (store[0] == item) {
//     return true;
//   } else {
//     let index = store.indexOf(item);
//     debugger
//   }
// }
// 
// function includesText(store, text) {
//   let regex = new RegExp(text, 'ig');
//   return store.some(function(item) {
//     regex.lastIndex = 0;
//     return regex.test(item.text);
//   });
// }
// 
// function scale(store, startIndex) {
//   const item = store[startIndex];
//   let stopIndex;
//   store.forEach(function(x, i) {
//     if (i !== startIndex && typeof stopIndex === 'undefined') {
//       if (x.depth === item.depth) {
//         stopIndex = i;
//       }
//     }
//   });
//   return store.slice(startIndex, stopIndex);
// }
// 
// //
// // if item not match, then remove next until something has the same or lesser depth
// // if item matches, then add all until something has the same or lesser depth
// 
// 
// function filterOptions(store, text) {
//   let options = [];
//   let depth;
//   let regex = new RegExp(text, 'ig');
//   return store.reverse().filter(function(item) {
//     regex.lastIndex = 0;
//     if (regex.test(item.text)) {
//       if (depth < item.depth) {
//         depth = item.depth;
//       }
//       return item;
//     }
//     debugger
//   });
// }
// // console.log(filterOptions(store, 'c'));
// 
// // console.log(scale(store, 1));