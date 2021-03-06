
(function ($) {

  $.fn.stickyTable = function (args) {

    this.each(function () {
      var $sc = $(this);
      if ($sc.find('tbody').length === 0) {
        console.error($sc, "must be called on a <div> that includes a table with a <tbody> element.");
        return;
      }
      $sc.addClass('sticky-table-wrapper');
      if (typeof $sc.data('scroll-x') === 'undefined') {
        $sc.data('scroll-x', 0);
      }
      if (typeof $sc.data('scroll-y') === 'undefined') {
        $sc.data('scroll-y', 0);
      }

      function backgroundColor(styles, elem) {
        let color;
        if (styles.backgroundColor.replace(/\s/g, '') === 'rgba(0,0,0,0)') {
          const rowColor = getComputedStyle(elem.parentNode).backgroundColor;
          if (rowColor.replace(/\s/g, '') === 'rgba(0,0,0,0)') {
            return '#fff';
          } else {
            return rowColor;
          }
        } else {
          return styles.backgroundColor;
        }
      }


      // function generatePlaceholderTH(elem) {
      //   var $th = $(elem);
        
      //   if ($th.find('.sticky-table-header').length === 0) {
      //     var $clone = $('<div class="sticky-table-header"></div>');
      //     var $positioned = $('<div class="sticky-table-positioned"></div>');
      //     var styles = window.getComputedStyle(elem);
      //     //  $positioned.css({background: styles.backgroundColor});

      //     $clone.css({
      //       // top: `-${styles.borderTopWidth}`,
      //       // right: `-${styles.borderRightWidth}`,
      //       // bottom: `-${styles.borderBottomWidth}`,
      //       // left: `-${styles.borderLeftWidth}`,
      //       height: styles.height
      //     })


      //     console.log(styles.backgroundColor)
      //     $positioned.css({
      //       background: backgroundColor(styles, elem),
      //       // boxShadow: `0 0 0 1px ${styles.backgroundColor}`,
      //       paddingTop: styles.paddingTop,
      //       paddingRight: styles.paddingRight,
      //       paddingBottom: styles.paddingBottom,
      //       paddingLeft: styles.paddingLeft,
      //       borderTopWidth: styles.borderTopWidth,
      //       borderRightWidth:  styles.borderRightWidth,
      //       borderBottomWidth:  styles.borderBottomWidth,
      //       borderLeftWidth:  styles.borderLeftWidth,
      //       borderTopStyle: styles.borderTopStyle,
      //       borderRightStyle:  styles.borderRightStyle,
      //       borderBottomStyle:  styles.borderBottomStyle,
      //       borderLeftStyle:  styles.borderLeftStyle,
      //       borderTopColor: styles.borderTopColor,
      //       borderRightColor:  styles.borderRightColor,
      //       borderBottomColor:  styles.borderBottomColor,
      //       borderLeftColor:  styles.borderLeftColor,
      //     });
      //     // $th.css({ padding: 0, border: 0 });
      //     //  $positioned.attr('style', styles.cssText)
      //     var innerHTML = $th.html();

      //     // Fix for IE miscalculating height of empty <th>
      //     if (innerHTML.length === 0) {
      //       innerHTML = '&nbsp;';
      //       $th.html(innerHTML);
      //     }

      //     // $th.append($clone.html($positioned.html(innerHTML)));
      //   }
      // }

      // $sc.find('.sticky').each(function () {
      //   generatePlaceholderTH(this);
      // });
      // // var $offsetElems = $sc.find('.sticky .sticky-table-positioned');
      var $offsetElems = $sc.find('.sticky');
      var $scTable = $sc.find('table');

      var table = $scTable[0];
      var wrapper = $sc[0];
      var tableBox = table.getBoundingClientRect();
      var wrapperBox = wrapper.getBoundingClientRect();
      $sc.data('max-x', tableBox.width - wrapper.clientWidth);
      $sc.data('max-y', tableBox.height - wrapper.clientHeight);
      console.log('max-y', $sc.data('max-y'));



      // TODO : Would be good to have better touch handling for iOS/Android
      // element.addEventListener("touchstart", touchStart, false);
      // element.addEventListener("touchmove", touchMove, false);

      // Typically when scrolling and then calculating/repositioning an absolutely positioned element we get a lot of jitter
      // as the element is drawn to the page. This is because the events are "Scroll -> Calculate -> Position".
      // To fix this, have created a synthetic scroll event that tracks the amount of scroll wheel movement, then calculates
      // the new position, positioning the element, and finially scrolls the containing element.

      function wheelHandler($sc, $scTable, event) {
        const scBox = $sc[0].getBoundingClientRect();
        const scTableBox = $scTable[0].getBoundingClientRect();
        // console.log(scBox, scTableBox)
        if (scTableBox.height > scBox.height || scTableBox.width > scBox.width) {
          if (
            ($sc.scrollTop() > 0 && $scTable.height() > ($sc.scrollTop() + $sc.height())) || ($sc.scrollTop() === 0 && event.originalEvent.deltaY > 0)
            ||
            ($sc.scrollLeft() > 0 && $scTable.width() > ($sc.scrollLeft() + $sc.width())) || ($sc.scrollLeft() === 0 && event.originalEvent.deltaX > 0)
          ) {
            event.preventDefault();
            calculatePosition($sc, $scTable, $offsetElems, event.originalEvent.deltaX, event.originalEvent.deltaY);
          }
        }
      }

      function positionHeader($elems, scrollX, scrollY) {
        var transformation, shadow, shadowOffset;
        $elems.css({
          //  top: scrollY + 'px',
          //  bottom: -scrollY + 'px',
          //  left: scrollX + 'px',
          //  right: -scrollX + 'px'
          transform: `translate(${scrollX}px, ${scrollY}px)`
        });
      }
  
      function calculatePosition($sc, $scTable, $offsetElems, changeX, changeY) {
        var existingX = $sc.data('scroll-x');
        var existingY = $sc.data('scroll-y');
        var maxX = $sc.data('max-x');
        var maxY = $sc.data('max-y');
        var newX = existingX + changeX;
        var newY = existingY + changeY;
        console.log('newY', newY, maxY)
  
        if (newX < 0) {
          newX = 0;
        } else if (newX > maxX) {
          newX = maxX;
        }
        if (newY < 0) {
          newY = 0;
        } else if (newY > maxY) {
          newY = maxY;
          console.log('newY reset', newY, maxY)
        }
  
        $sc.data({ 'scroll-x': newX, 'scroll-y': newY });
        $sc.scrollLeft(newX);
        $sc.scrollTop(newY);
        positionHeader($offsetElems, newX, newY);
      }
        
      $sc.off('wheel.stickyTable mousewheel.stickyTable', wheelHandler).on('wheel.stickyTable mousewheel.stickyTable', function (event) {
        wheelHandler($sc, $scTable, event);
      });

      function scrollHandler($offsetElems, $sc) {
        $sc.data({ 'scroll-x': $sc.scrollLeft(), 'scroll-y': $sc.scrollTop() });
        positionHeader($offsetElems, $sc.scrollTop());
      }

      $sc.off('scroll.stickyTable', scrollHandler).on('scroll.stickyTable', function (event) {
        if ($scTable.height() > $sc.height()) {
          scrollHandler($offsetElems, $sc)
        }
      });

      if ($sc.scrollTop() > 0) {
        scrollHandler($offsetElems, $sc)
      }

    });

    return this;
  };

}(jQuery));