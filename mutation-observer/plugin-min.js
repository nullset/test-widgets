'use strict';

var watchElem = document.querySelector('#watchElem');
var list = document.querySelector('#list');

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

document.querySelector('#addChild').addEventListener('click', function () {
  addChild();
});

document.querySelector('#changeText').addEventListener('click', function () {
  changeText();
});

document.querySelector('#addListElement').addEventListener('click', function () {
  addListElement();
});

document.querySelector('#changeColor').addEventListener('click', function () {
  changeColor();
});

document.querySelector('#doAll').addEventListener('click', function () {
  changeText();
  addChild();
  addListElement();
  changeColor();
});

function addChild() {
  var newElem = document.createElement('p');
  newElem.innerHTML = 'paragraph ' + randomNumber();
  watchElem.appendChild(newElem);
}

function addListElement() {
  var newElem = document.createElement('li');
  newElem.innerHTML = 'Elem: <b>' + randomNumber() + '</b>';
  list.appendChild(newElem);
}

function changeColor() {
  watchElem.querySelectorAll('*').forEach(function (elem) {
    elem.style.color = 'rgb(' + colorValue() + ', ' + colorValue() + ', ' + colorValue() + ')';
  });
}

function colorValue() {
  return randomNumber(255);
}

function changeText() {
  watchElem.firstElementChild.innerText = watchElem.firstElementChild.innerText + (' \u2219 ' + randomNumber());
}

function randomNumber() {
  var max = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 99999;

  return Math.floor(Math.random() * Math.floor(max));
}

///////////////// ----------------------------------
(function ($) {
  // Polyfill Element.matches for IE9+.
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
  }

  $.fn.detect2 = function (opts) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // Watch for both added and removed elements, and behave accordingly.
        ['added', 'removed'].forEach(function (operation) {
          if (opts[operation]) {
            Array.from(mutation[operation + 'Nodes']).forEach(function (node) {
              if (node.nodeType === 1) {
                var matchingNodes = void 0;
                if (node.matches(opts.matches)) {
                  matchingNodes = [node];
                } else {
                  matchingNodes = Array.from(node.querySelectorAll(opts.matches));
                }
                matchingNodes.forEach(function (matchingNode) {
                  opts[operation](node);
                  observer.takeRecords();
                });
              }
            });
          }
        });
      });
    });

    var watchSubtree = opts.shallow === undefined ? true : !opts.shallow;

    this.each(function () {
      observer.observe(this, {
        childList: true,
        subtree: watchSubtree
      });
    });
  };

  var uuids = {};

  function defaultValue(thing, def) {
    return typeof thing === 'undefined' ? def : thing;
  }

  function run() {
    Object.entries(window.detectChanges).forEach(function (arr) {
      var _arr$ = arr[1],
          elems = _arr$.elems,
          fn = _arr$.fn,
          fnOptions = _arr$.fnOptions;
    });
    // Array.from(document.querySelectorAll(opts.scope)).forEach((elem) => {
    //   if (!elem.detectChanges) {
    //     Object.defineProperty(elem, 'detectChanges', {
    //       value: {}, 
    //       writable: true,
    //       enumerable: false,
    //     })
    //   }
    // });
  }

  $.fn.detect = function (opts) {
    if (!opts.scope) {
      opts.scope = 'html';
    }

    if (!opts.options) {
      opts.options = {};
    }

    var observerOptions = {
      childList: defaultValue(opts.options.childList, true),
      attributes: defaultValue(opts.options.attributes, true),
      charaterData: defaultValue(opts.options.charaterData, true),
      subtree: defaultValue(opts.options.subtree, true),
      attributeOldValue: defaultValue(opts.options.attributeOldValue, undefined),
      characterDataOldValue: defaultValue(opts.options.characterDataOldValue, undefined),
      attributeFilter: defaultValue(opts.options.attributeFilter, undefined)
    };

    var key = [];
    Object.entries(observerOptions).forEach(function (arr) {
      var value = typeof arr[1] === 'undefined' ? 'undefined' : arr[1].toString();
      key.push(arr[0] + ':' + value);
    });

    key = key.toString();
    // if (!uuids[key]) {
    //   uuids[key] = [];
    // }

    // uuids[key].push({
    //   scope: opts.scope,
    //   watch: this.selector,
    //   options: observerOptions,
    //   added: opts.added,
    //   removed: opts.removed,
    // });

    if (!window.detectChanges) {
      Object.defineProperty(window, 'detectChanges', {
        value: {},
        writable: true,
        enumerable: false
      });
    }

    if (!window.detectChanges[key]) {
      window.detectChanges[key] = {
        elems: {},
        fnOptions: observerOptions,
        fn: new MutationObserver(function (mutations) {
          console.log('mutations', mutations);
          mutations.forEach(function (mutation) {
            // Watch for both added and removed elements, and behave accordingly.
            ['added', 'removed'].forEach(function (operation) {
              Array.from(mutation[operation + 'Nodes']).forEach(function (node) {
                if (node.nodeType === 1) {
                  actions.forEach(function (action) {
                    var matchingNodes = void 0;
                    if (node.matches(action.watch)) {
                      matchingNodes = [node];
                    } else {
                      matchingNodes = Array.from(node.querySelectorAll(action.watch));
                    }
                    matchingNodes.forEach(function (matchingNode) {
                      if (action[operation]) {
                        action[operation](node);
                        observer.takeRecords();
                      }
                    });
                  });
                }
              });
            });
          });
        })
      };
    }

    if (!window.detectChanges[key].elems[opts.scope]) {
      window.detectChanges[key].elems[opts.scope] = {
        added: [],
        removed: []
      };
    }

    if (opts.added) {
      window.detectChanges[key].elems[opts.scope].added.push(opts.added);
    }

    if (opts.removed) {
      window.detectChanges[key].elems[opts.scope].removed.push(opts.removed);
    }

    // window.detectChanges[key].push({
    //   scope: opts.scope,

    // })

    // const selector = this.selector;


    // Array.from(document.querySelectorAll(opts.scope)).forEach((elem) => {
    //   if (!opts.mutationObservers) {
    //     Object.defineProperty(elem, 'mutationObservers', {
    //       value: {
    //         obs: {},
    //       },
    //       writable: true
    //     });    
    //   };

    //   if (!elem.mutationObservers.obs[key]) {
    //     elem.mutationObservers.obs[key] = {
    //       observer: function() {},
    //       watch: [],
    //     }
    //   }

    //   elem.mutationObservers.obs[key].watch.push({
    //     elem: selector,
    //     added: opts.added,
    //     removed: opts.removed,
    //   });  
    // });

  };

  window.addEventListener("load", run);

  // window.addEventListener("load", function(event) {
  //   console.log("All resources finished loading!");

  //   Object.entries(uuids).forEach((arr) => {
  //     const {scope, options} = arr[1][0];
  //     const actions = arr[1];

  // const observer = new MutationObserver((mutations) => {
  //   console.log('mutations', mutations);
  //   mutations.forEach((mutation) => {
  //     // Watch for both added and removed elements, and behave accordingly.
  //     ['added', 'removed'].forEach((operation) => {
  //       Array.from(mutation[`${operation}Nodes`]).forEach((node) => {
  //         if (node.nodeType === 1) {
  //           actions.forEach((action) => {
  //             let matchingNodes;
  //             if (node.matches(action.watch)) {
  //               matchingNodes = [node];
  //             } else {
  //               matchingNodes = Array.from(node.querySelectorAll(action.watch));
  //             }
  //             matchingNodes.forEach((matchingNode) => {
  //               if (action[operation]) {
  //                 action[operation](node);
  //                 observer.takeRecords();  
  //               }
  //             });
  //           });
  //         }
  //       });
  //     });
  //   });
  // });

  //     debugger
  //     Array.from(document.querySelectorAll(scope)).forEach((elem) => {
  //       observer.observe(elem, options);  
  //     });

  //   });
  // });
})(jQuery);

$('p').detect({
  scope: '#watchElem',
  added: function added(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  },
  removed: function removed(elem) {
    alert('where did you go P tag ' + elem.innerText + '?');
  }
});

$('li').detect({
  // scope: '#watchElem',
  added: function added(elem) {
    var newP = document.createElement('li');
    newP.innerText = 'new LI';
    elem.parentElement.appendChild(newP);
  },
  removed2: function removed2(elem) {
    alert('where did you go LI tag ' + elem.innerText + '?');
  }
});

$('#watchElem2').detect2({
  matches: 'p',
  added: function added(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  },
  removed: function removed(elem) {
    alert('where did you go ' + elem.innerText + '?');
  }
});

$('#watchElem2').detect2({
  matches: 'li',
  shallow: true,
  added: function added(elem) {
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
