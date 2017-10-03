
(function ($) {

  $.fn.stickyTable = function (args) {

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

      if (newX < 0) {
        newX = 0;
      } else if (newX > maxX) {
        newX = maxX;
      }
      if (newY < 0) {
        newY = 0;
      } else if (newY > maxY) {
        newY = maxY;
      }

      $sc.data({ 'scroll-x': newX, 'scroll-y': newY });
      $sc.scrollLeft(newX);
      $sc.scrollTop(newY);
      positionHeader($offsetElems, newX, newY);
    }

    this.each(function () {
      var $sc = $(this);
      if ($sc.find('thead').length === 0 || $sc.find('tbody').length === 0) {
        console.error($sc, "must be called on a <div> that includes a table with both a <thead> and a <tbody> element.");
        return;
      }
      $sc.addClass('sticky-table-wrapper');
      if (typeof $sc.data('scroll-x') === 'undefined') {
        $sc.data('scroll-x', 0);
      }
      if (typeof $sc.data('scroll-y') === 'undefined') {
        $sc.data('scroll-y', 0);
      }

      function generatePlaceholderTH(elem) {
        var $th = $(elem);
        if ($th.find('.sticky-table-header').length === 0) {
          var $clone = $('<div class="sticky-table-header"></div>');
          var $positioned = $('<div class="sticky-table-positioned"></div>');
          var styles = window.getComputedStyle(elem);
          //  $positioned.css({background: styles.backgroundColor});
          $positioned.css({
            background: styles.backgroundColor,
            // boxShadow: `0 0 0 1px ${styles.backgroundColor}`,
            padding: styles.padding,
          });
          $th.css({ padding: 0 })
          //  $positioned.attr('style', styles.cssText)
          var innerHTML = $th.html();

          // Fix for IE miscalculating height of empty <th>
          if (innerHTML.length === 0) {
            innerHTML = '&nbsp;';
            $th.html(innerHTML);
          }

          $th.append($clone.html($positioned.html(innerHTML)));
        }
      }

      $sc.find('.sticky').each(function () {
        generatePlaceholderTH(this);
      });
      var $offsetElems = $sc.find('.sticky .sticky-table-positioned');
      var $scTable = $sc.find('table');
      $sc.data('max-x', $scTable.width() - $sc.width());
      $sc.data('max-y', $scTable.height() - $sc.height());



      // TODO : Would be good to have better touch handling for iOS/Android
      // element.addEventListener("touchstart", touchStart, false);
      // element.addEventListener("touchmove", touchMove, false);

      // Typically when scrolling and then calculating/repositioning an absolutely positioned element we get a lot of jitter
      // as the element is drawn to the page. This is because the events are "Scroll -> Calculate -> Position".
      // To fix this, have created a synthetic scroll event that tracks the amount of scroll wheel movement, then calculates
      // the new position, positioning the element, and finially scrolls the containing element.

      function wheelHandler($sc, $scTable, event) {
        if ($scTable.height() > $sc.height() || $scTable.width() > $sc.width()) {
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