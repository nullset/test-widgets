(function( $ ) {
 
    $.fn.scrollTable = function() {

      function positionHeader($elems, scrollY) {
        var transformation, shadow, shadowOffset;
        if (/firefox/i.test(navigator.userAgent)) {
          transformation = 'translate(-1px, ' + (scrollY - 1) + 'px)';
        } else {
          transformation = 'translateY(' + scrollY + 'px)';
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
        var existingX = typeof $sc.data('scroll-x') === 'undefined' ? 0 : parseInt($sc.data('scroll-x'), 10);
        var existingY = typeof $sc.data('scroll-y') === 'undefined' ? 0 : parseInt($sc.data('scroll-y'), 10);
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
        positionHeader($offsetElems, newY);
      }

      this.each(function() {
        var $sc = $(this);

        if ($sc.find('thead').length === 0 || $sc.find('tbody').length === 0) {
          console.error($sc, "must be called on a <div> that includes a table with both a <thead> and a <tbody> element.")
        }
        var $offsetElems = $sc.find('thead tr > *');
        var $scTable = $sc.find('table');


        // element.addEventListener("touchstart", touchStart, false);
        // element.addEventListener("touchmove", touchMove, false);
        // element.ontouchmove
        $sc.on('wheel mousewheel', function(event) {
          event.preventDefault();
          calculatePosition($sc, $scTable, $offsetElems, event.originalEvent.deltaX, event.originalEvent.deltaY);
        });

        // $sc.on('mousedown', function(event) {
        //   $sc.data({mousedown: true, 'click-offset-y': event.offsetY, 'click-offset-x': event.offsetX});
        // });
        $sc.on('scroll', function(event) {
          // $sc.scrollTop($sc.scrollTop());
          // event.preventDefault(); // Does not work, need to reset the scroll position after it is set to effect preventDefault
          
          // if ($sc.data('mousedown') === true) {
          //   // need to account for presence of scrollbar too
          //   // console.log($sc.data('click-offset-y'), $sc.height(), $scTable.height());
          //   var clickAtRatio = $sc.data('click-offset-y')/$sc.height();
          //   var scrollAtRatio = $sc.scrollTop()/$scTable.height();
          //   console.log(clickAtRatio, scrollAtRatio);
          //   // $sc.scrollTop((clickAtRatio) * ($scTable.height() - $sc.height()));
          //   // $sc.scrollTop($sc.data('click-offset-y'));
          //   // $sc.scrollLeft($sc.data('click-offset-x'));
          // }
          // // if ($sc.data('mousedown') !== true) {
            $sc.data({'scroll-x': $sc.scrollLeft(), 'scroll-y': $sc.scrollTop()});
            positionHeader($offsetElems, $sc.scrollTop());
          // // }
        });
      });
 
        // this.filter( "a" ).each(function() {
        //     var link = $( this );
        //     link.append( " (" + link.attr( "href" ) + ")" );
        // });
 
      return this;
 
    };
 
}( jQuery ));

$('.scrolling-tbody').scrollTable();


// var $sc = $('.scrolling-tbody');
// var $offsetElems = $sc.find('thead tr > *');
// var $scTable = $sc.find('table');
// 
// function positionHeader($elems, scrollY) {
//   var transformation, shadow, shadowOffset;
//   if (/firefox/i.test(navigator.userAgent)) {
//     transformation = 'translate(-1px, ' + (scrollY - 1) + 'px)';
//   } else {
//     transformation = 'translateY(' + scrollY + 'px)';
//   }
//   if (scrollY === 0) {
//     shadow = 'none';
//   } else if (scrollY <= 50) {
//     shadowOffset = Math.ceil(scrollY)/10;
//     shadow = '0 ' + shadowOffset + 'px ' + shadowOffset + 'px rgba(0,0,0,0.3)';
//   }
//   $elems.each(function(i, elem) {
//     $(elem).css({
//       '-webkit-transform': transformation,
//       '-moz-transform': transformation,
//       '-ms-transform': transformation,
//       '-o-transform': transformation,
//       transform: transformation,
//       'box-shadow': shadow
//     });
//   });
// }

// $sc.on('wheel mousewheel', function(event) {
//   event.preventDefault();
//   var existingX = typeof $sc.data('scroll-x') === 'undefined' ? 0 : parseInt($sc.data('scroll-x'), 10);
//   var existingY = typeof $sc.data('scroll-y') === 'undefined' ? 0 : parseInt($sc.data('scroll-y'), 10);
//   var newX = existingX + event.originalEvent.deltaX;
//   var newY = existingY + event.originalEvent.deltaY;
//   if (newX < 0) {
//     newX = 0;
//   }
//   if (newY < 0) {
//     newY = 0;
//   }
//   
//   if (newX > $scTable.width() - $sc.width() + ($sc[0].offsetWidth - $sc[0].clientWidth)) {
//     newX = existingX;
//   }
//   if (newY > $scTable.height() - $sc.height() + ($sc[0].offsetHeight - $sc[0].clientHeight)) {
//     newY = existingY;
//   }
//   
//   $sc.data({'scroll-x': newX, 'scroll-y': newY});
//   $sc.scrollLeft(newX);
//   $sc.scrollTop(newY);
//   positionHeader($offsetElems, newY);
// });
// 
// $sc.on('scroll', function(event) {
//   $sc.data({'scroll-x': $sc.scrollLeft(), 'scroll-y': $sc.scrollTop()});
//   positionHeader($offsetElems, $sc.scrollTop());
// });
