const watchElem = document.querySelector('#watchElem');
const list = document.querySelector('#list');

// const observer =  new MutationObserver((mutations) => {
//   console.log('----------------');
//   console.log(mutations);

//   // //-- Don't mutate the DOM within a mutation observer.
//   // const badElem = document.createElement('p')
//   // badElem.innerHTML = 'BAD!';
//   // watchElem.appendChild(badElem);
//   // // Synchronously grab any outstanding mutations and process them now,
//   // // preventing the MutationObserver from being called again..
//   // var outstandingMutations = observer.takeRecords();
// });

// observer.observe(watchElem, {
//   childList: true,
//   attributes: true,
//   characterData: true,
//   // subtree: true,
//   // attributeOldValue: true,
//   // characterDataOldValue: true,
//   // attributeFilter: ['class'],
// })

document.querySelector('#addChild').addEventListener('click', ()=> {
  addChild();
});

document.querySelector('#changeText').addEventListener('click', ()=> {
  changeText();
});

document.querySelector('#addListElement').addEventListener('click', ()=> {
  addListElement();
});

document.querySelector('#changeColor').addEventListener('click', ()=> {
  changeColor();
});

document.querySelector('#doAll').addEventListener('click', ()=> {
  changeText();
  addChild();
  addListElement();
  changeColor();
});

function addChild() {
  const newElem = document.createElement('p');
  newElem.innerHTML = `paragraph ${randomNumber()}`;
  watchElem.appendChild(newElem);
}

function addListElement() {
  const newElem = document.createElement('li');
  newElem.innerHTML = `Elem: <b>${randomNumber()}</b>`;
  list.appendChild(newElem);
}

function changeColor() {
  watchElem.querySelectorAll('*').forEach((elem) => {
    elem.style.color = `rgb(${colorValue()}, ${colorValue()}, ${colorValue()})`;
  });
}

function colorValue() {
  return randomNumber(255);
}

function changeText() {
  watchElem.firstElementChild.innerText = watchElem.firstElementChild.innerText + ` ∙ ${randomNumber()}`;
}

function randomNumber(max = 99999) {
  return Math.floor(Math.random() * Math.floor(max));
}


///////////////// ----------------------------------
(function( $ ) {
  // Polyfill Element.matches for IE9+.
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
  }
 
  $.fn.detect2 = function(opts) {
    const observer =  new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watch for both added and removed elements, and behave accordingly.
        ['added', 'removed'].forEach((operation) => {
          if (opts[operation]) {
            Array.from(mutation[`${operation}Nodes`]).forEach((node) => {
              if (node.nodeType === 1) {
                let matchingNodes;
                if (node.matches(opts.matches)) {
                  matchingNodes = [node];
                } else {
                  matchingNodes = Array.from(node.querySelectorAll(opts.matches));
                }
                matchingNodes.forEach((matchingNode) => {
                  opts[operation](node);
                  observer.takeRecords();
                });
              }
            });  
          }
        });
      });
    });
    
    const watchSubtree = opts.shallow === undefined ? true : !opts.shallow;

    this.each(function() {
      observer.observe(this, {
        childList: true,
        subtree: watchSubtree,
      })
    });
  
  };

  const scopes = {};

  $.fn.detect = function(opts) {
    if (!scopes[opts.scope]) {
      scopes[opts.scope] = [];
    }

    scopes[opts.scope].push({
      watch: this.selector,
      added: opts.added,
      removed: opts.removed,
    });

    // const observer =  new MutationObserver((mutations) => {
    //   mutations.forEach((mutation) => {
    //     // Watch for both added and removed elements, and behave accordingly.
    //     ['added', 'removed'].forEach((operation) => {
    //       if (opts[operation]) {
    //         Array.from(mutation[`${operation}Nodes`]).forEach((node) => {
    //           if (node.nodeType === 1) {
    //             let matchingNodes;
    //             if (node.matches(opts.matches)) {
    //               matchingNodes = [node];
    //             } else {
    //               matchingNodes = Array.from(node.querySelectorAll(opts.matches));
    //             }
    //             matchingNodes.forEach((matchingNode) => {
    //               opts[operation](node);
    //               observer.takeRecords();
    //             });
    //           }
    //         });  
    //       }
    //     });
    //   });
    // });
    
    // const watchSubtree = opts.shallow === undefined ? true : !opts.shallow;

    // this.each(function() {
    //   observer.observe(this, {
    //     childList: true,
    //     subtree: watchSubtree,
    //   })
    // });
    
  
  };  

  window.addEventListener("load", function(event) {
    console.log("All resources finished loading!");

    Object.entries(scopes).forEach((arr) => {
      const scope = arr[0];
      const actions = arr[1];

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Watch for both added and removed elements, and behave accordingly.
          ['added', 'removed'].forEach((operation) => {
            Array.from(mutation[`${operation}Nodes`]).forEach((node) => {
              if (node.nodeType === 1) {
                actions.forEach((action) => {
                  console.log('node', node)                
                  if (node.matches(action.watch)) {
                    debugger
                    action[operation](node);
                    observer.takeRecords();
                  }    
                });
              }
            });
          });
        });
      });

      Array.from(document.querySelectorAll(scope)).forEach((elem) => {
        observer.observe(elem, {
          childList: true,
          subtree: true,
        });  
      });

    });
  });

}( jQuery ));

$('p').detect({
  scope: '#watchElem',
  added: function(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  },
  removed: function(elem) {
    alert(`where did you go P tag ${elem.innerText}?`)
  }
});

$('li').detect({
  scope: '#watchElem',
  added: function(elem) {
    var newP = document.createElement('li');
    newP.innerText = 'new LI';
    elem.parentElement.appendChild(newP);
  },
  removed: function(elem) {
    alert(`where did you go LI tag ${elem.innerText}?`)
  }
});

$('#watchElem2').detect2({
  matches: 'p',
  added: function(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  },
  removed: function(elem) {
    alert(`where did you go ${elem.innerText}?`)
  }
});

$('#watchElem2').detect2({
  matches: 'li',
  shallow: true,
  added: function(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'oooooo oooo';
    elem.parentElement.appendChild(newP);
  }
});


// $(elem).detect({
//   matches: string,   // simple query selector
//   shallow: boolean,  // default: false
//   added: function(elem),
//   removed: function(elem),
// })