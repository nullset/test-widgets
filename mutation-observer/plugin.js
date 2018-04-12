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
 
  $.fn.lq = function(options) {
    const selector = this.selector;
    const observer =  new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watch for both added and removed elements, and behave accordingly.
        ['added', 'removed'].forEach((operation) => {
          if (options[operation]) {
            Array.from(mutation[`${operation}Nodes`]).forEach((node) => {
              if (node.nodeType === 1) {
                if (node.matches(selector)) {
                  options[operation](node);
                  observer.takeRecords();
                } else {
                  const matchingNodes = node.querySelectorAll(selector);
                  Array.from(matchingNodes).forEach((matchingNode) => {
                    options[operation](node);
                    observer.takeRecords();
                  });
                }
              }
            });  
          }
        });
      });
  });
    

  observer.observe(document.querySelector('body'), {
    childList: true,
    // attributes: true,
    // characterData: true,
    subtree: true,
    // attributeOldValue: true,
    // characterDataOldValue: true,
    // attributeFilter: ['class'],
  })
    
  };

}( jQuery ));

$('p').lq({
  added: function(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  },
  removed: function(elem) {
    alert(`where did you go ${elem.innerText}?`)
  }
});

$('li').lq({
  added: function(elem) {
    var newP = document.createElement('p');
    newP.innerText = 'blah dee blah';
    elem.parentElement.appendChild(newP);
  }
});