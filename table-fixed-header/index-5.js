(function( $ ) {
 
    $.fn.scrollTable = function() {

      function positionHeader($elems, tableHeight, elemHeight, borderTopWidth, scrollY) {
        var transformation, shadow, shadowOffset;
        if (/firefox/i.test(navigator.userAgent)) {
          // transformation = 'translate(-1px, ' + (scrollY - 1) + 'px)';
          transformation = 'translate(-1px, ' + (scrollY - tableHeight + elemHeight + borderTopWidth) + 'px)';
        } else {
          transformation = 'translateY(' + (scrollY - tableHeight + elemHeight + borderTopWidth) + 'px)';
        }
        if (scrollY === 0) {
          shadow = 'none';
        } else if (scrollY <= 50) {
          shadowOffset = Math.ceil(scrollY)/10;
          shadow = '0 ' + shadowOffset + 'px ' + shadowOffset + 'px rgba(0,0,0,0.3)';
        }
        $elems.each(function(i, elem) {
          $(elem).css({
            '-webkit-transform': transformation,
            '-moz-transform': transformation,
            '-ms-transform': transformation,
            '-o-transform': transformation,
            transform: transformation,
            'box-shadow': shadow
          });
        });
      }
      
      function calculatePosition($sc, $scTable, $offsetElems, changeX, changeY) {
        var existingX = $sc.data('scroll-x');
        var existingY = $sc.data('scroll-y');
        var newX = existingX + changeX;
        var newY = existingY + changeY;
        
        if (newX < 0) {
          newX = 0;
        }
        if (newY < 0) {
          newY = 0;
        }
        
        if (newX > $scTable.width() - $sc.width() + ($sc[0].offsetWidth - $sc[0].clientWidth)) {
          newX = existingX;
        }
        if (newY > $scTable.height() - $sc.height() + ($sc[0].offsetHeight - $sc[0].clientHeight)) {
          newY = existingY;
        }
        
        $sc.data({'scroll-x': newX, 'scroll-y': newY});
        $sc.scrollLeft(newX);
        $sc.scrollTop(newY);
        // positionHeader($offsetElems, newY);
        borderTopWidth = parseInt(window.getComputedStyle($offsetElems[0]).borderTopWidth, 10);
        positionHeader($offsetElems, $scTable.outerHeight(), $offsetElems.outerHeight(), borderTopWidth, newY);

      }

      this.each(function() {
        var $sc = $(this);
        $sc.addClass('.sticky-table-wrapper');
        if (typeof $sc.data('scroll-x') === 'undefined') {
          $sc.data('scroll-x', 0);
        }
        if (typeof $sc.data('scroll-y') === 'undefined') {
          $sc.data('scroll-y', 0);
        }

        if ($sc.find('thead').length === 0 || $sc.find('tbody').length === 0) {
          console.error($sc, "must be called on a <div> that includes a table with both a <thead> and a <tbody> element.")
        }
        var $scTable = $sc.find('table');

        var $tfootRow = $scTable.find('thead > tr').clone(true, true);
        // $scTable.append($('<tfoot></tfoot>')$tfoot);
        var $tfoot = $('<tfoot></tfoot>');
        $scTable.append($tfoot.append($tfootRow));
        var $offsetElems = $tfoot.find('tr > *');
        
        // TODO : Would be good to have better touch handling for iOS/Android
        // element.addEventListener("touchstart", touchStart, false);
        // element.addEventListener("touchmove", touchMove, false);

        $sc.on('wheel mousewheel', function(event) {
          event.preventDefault();
          calculatePosition($sc, $scTable, $offsetElems, event.originalEvent.deltaX, event.originalEvent.deltaY);
        });
        
        $sc.on('scroll', function(event) {
          $sc.data({'scroll-x': $sc.scrollLeft(), 'scroll-y': $sc.scrollTop()});
          positionHeader($offsetElems, $sc.scrollTop());
        });
      });
 
      return this;
    };
 
}( jQuery ));

$('.scrolling-tbody').scrollTable();
