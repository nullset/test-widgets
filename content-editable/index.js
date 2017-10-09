let target = document.getElementById('blah');
let selection;
let range;
let editableElem;

target.addEventListener('mouseup', () => {
  // console.log('focused')
  // selection = window.getSelection();
  // range = document.createRange();
  // console.log('initial:', selection, range);
  // // console.log('child nodes', target.childNodes.length, Array.from(target.childNodes).indexOf(selection.anchorNode))
  // console.log('child nodes', target.childNodes.length, Array.from(target.childNodes).findIndex((x) => {
  //   return x === parentUntilContentEditable(selection.anchorNode, target);
  // }) )
  console.log(getCursorPosition());
})

target.addEventListener('keydown', () => {
  console.log(getCursorPosition());
})

function getCursorPosition() {
  let selection = window.getSelection();
  let node = selection.anchorNode;
  let nodePosition = Array.from(target.childNodes).findIndex((x) => {
    return x === parentUntilContentEditable(node, target);
  });
  if (node.nodeType === 3) {
    console.log('nodePosition', nodePosition);
    nodePosition = selection.anchorOffset;
  }
  return nodePosition;
}

function parentUntilContentEditable(node, rootElem) {
  if (node.nodeType === 3) {
    if (node.parentNode !== rootElem) {
      node = parentUntilContentEditable(node.parentNode, rootElem);
    }
  } else {
    if (!node.hasAttribute('contenteditable')) {
      node = parentUntilContentEditable(node.parentNode, rootElem);
    }
  }
  return node;
}

function targetIsNode(target, node) {
  let treeWalker = document.createTreeWalker(target);
  let inTarget = false;
  debugger
  while (treeWalker.nextNode()) {
    console.log('---',treeWalker.currentNode, node);
    if (treeWalker.currentNode === node) {
      inTarget = true;
    }
  }
  return inTarget;
}
// create an observer instance
var observer = new MutationObserver(function(mutations) {
  console.log
//  mutations.forEach(function(mutation) {
//    console.log(mutation.type);
//  });    
});

// configuration of the observer:
var config = { attributes: true, childList: true, characterData: true };

// pass in the target node, as well as the observer options
observer.observe(target, config);