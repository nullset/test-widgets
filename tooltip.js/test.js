// (function($) {
//   // WeakMap of DOM nodes to tooltip instances. Using WeakMap allows values to be garbage collected when
//   // the element which forms the "key" is removed from the DOM.
//   const refs = new WeakMap();

//   $.fn.ahaTooltip = function(opts = {}) {
//     if (typeof opts === 'string') {
//     } else {
      
//     }
//   };

// })(jQuery);



$.fn.ahaTooltip = function(opts = {}) {
  this.type = opts.type || 'tooltip';
  debugger
  return this;
}

$.fn.popover = function(opts = {}) {

  const blah = $.extend($.fn.ahaTooltip, {
    type: 'popover'
  });
  return this;
}

debugger


