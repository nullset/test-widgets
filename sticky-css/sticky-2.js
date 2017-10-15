
(function ($) {

  $.fn.stickyTable = function (args) {
    this.each(() => {
      const $table = this;
      const table = $table[0];
      const tableStyles = window.getComputedStyle(table);
      const $wrapper = wrapTable($table, tableStyles);
      const $stickyElems = $table.find('th.sticky, td.sticky');

      // Variable that tracks whether "wheel" event was called.
      // Prevents both "wheel" and "scroll" events being triggered simultaneously.
      let wheelEventTriggered = false;

      positionStickyElements($stickyElems);

      $stickyElems.each((i, cell) => {
        cellStyles = window.getComputedStyle(cell);
        ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => {
          ['Width'].forEach((property) => {
            cell.style.setProperty(`--border-${side.toLowerCase()}-${property.toLowerCase()}`, cellStyles[`border${side}${property}`]);
          });
        });
      });

      $wrapper.off('wheel.stickyTable mousewheel.stickyTable', wheelHandler).on('wheel.stickyTable mousewheel.stickyTable', function (event) {
        wheelEventTriggered = true;
        event.preventDefault();
        const { deltaX, deltaY } = event.originalEvent;
        const { scrollWidth, scrollHeight } = $wrapper[0];
        let maxWidth = scrollWidth - $wrapper[0].clientWidth;
        let maxHeight = scrollHeight - $wrapper[0].clientHeight;

        let { scrollX, scrollY } = $wrapper.data();
        let newX = scrollX + deltaX;
        let newY = scrollY + deltaY;
        if (newX >= maxWidth) {
          newX = maxWidth;
        }
        if (newX <= 0) {
          newX = 0;
        }
        if (newY >= maxHeight) {
          newY = maxHeight;
        }
        if (newY <= 0) {
          newY = 0;
        }
        if (newX > 0 || newY > 0) {
          $wrapper.addClass('--is-scrolling');
        } else {
          $wrapper.removeClass('--is-scrolling');
        }
        $wrapper.data({scrollX: newX, scrollY: newY});
        $wrapper.scrollLeft(newX).scrollTop(newY);
        positionStickyElements($stickyElems, newX, newY);
    });

      $wrapper.off('scroll.stickyTable', scrollHandler).on('scroll.stickyTable', () => {
        if (wheelEventTriggered) {
          wheelEventTriggered = false;
        } else {
          scrollHandler($wrapper, $stickyElems, $wrapper.scrollLeft(), $wrapper.scrollTop());
        }
      })

      return {$table, $wrapper};
    });

    function wrapTable($table, tableStyles) {
      const $wrapper = $('<div class="sticky-table-wrapper">');

      // Set styles.
      $wrapper.css({
        maxWidth: tableStyles.maxWidth,
        maxHeight: tableStyles.maxHeight,
        overflowX: tableStyles.maxWidth === 'none' ? 'hidden' : 'auto',
        overflowY: tableStyles.maxHeight === 'none' ? 'hidden' : 'auto',
      });

      // Set initial scrolled value.
      $wrapper.data({
        scrollX: 0,
        scrollY: 0
      });

      // Wrap existing table inside wrapper.
      $table.wrap($wrapper);

      // Determine just how much the wrapper can be scrolled.
      // setMaxScrollValues($table)
      
      return $table.parent();
    }

    // function setMaxScrollValues($table) {
    //   const table = $table[0];
    //   const tableBox = table.getBoundingClientRect();
    //   const wrapper = table.parentElement;
    //   $(wrapper).data({
    //     maxX: tableBox.width - wrapper.clientWidth,
    //     maxY: tableBox.height - wrapper.clientHeight,
    //     // maxX: tableBox.clientWidth - wrapper.clientWidth,
    //     // maxY: wrapper.clientHeight
    //   });
    // }

    function wheelHandler($table, $wrapper, $stickyElems, event) {
      const {deltaX, deltaY} = event.originalEvent;
      if ($table.height() > $wrapper.height() || $table.width() > $wrapper.width()) {
        if (
          ($wrapper.scrollTop() > 0 && $table.height() > ($wrapper.scrollTop() + $wrapper.height())) || ($wrapper.scrollTop() === 0 && deltaY > 0)
          ||
          ($wrapper.scrollLeft() > 0 && $table.width() > ($wrapper.scrollLeft() + $wrapper.width())) || ($wrapper.scrollLeft() === 0 && deltaX > 0)
        ) {
          event.preventDefault();
          const {newX, newY} = calculatePosition({currentPosition: $wrapper.data(), deltaX, deltaY});
          $wrapper.scrollLeft(newX);
          $wrapper.scrollTop(newY);
          updateScrollPosition($wrapper, $stickyElems, newX, newY);
        }
      }
    }

    function scrollHandler($wrapper, $stickyElems, offsetX, offsetY) {
      requestAnimationFrame(() => {
        console.log('scroll fired');
        updateScrollPosition($wrapper, $stickyElems, offsetX, offsetY);
      });
    }

    function updateScrollPosition($wrapper, $stickyElems, offsetX, offsetY) {
      $wrapper.data({scrollX: offsetX, scrollY: offsetY });
      positionStickyElements($stickyElems, offsetX, offsetY);
    }

    function calculateShadow(offset) {
      let shadow = offset/10;
      let max = 6;
      let min = 3;
      if (shadow > max) return max;
      if (shadow < min) return min;
      return shadow;
    }

    function positionStickyElements($elems, offsetX = 0, offsetY = 0) {
      $elems.each((i, cell) => {
        if (cell.classList.contains('sticky-scroll-x') && cell.classList.contains('sticky-scroll-y')) {
          return;
        }
        let shadowX = calculateShadow(offsetX);
        let shadowY = calculateShadow(offsetY);
        let transforms = [];
        let zIndex = 0;
        cell.style.setProperty(`--box-shadow`, `${shadowX}px ${shadowY}px ${shadowX}px rgba(0,0,0,0.15), ${shadowX}px ${shadowY}px ${shadowY}px  rgba(0,0,0,0.15)`);
        if (!cell.classList.contains('sticky-scroll-x')) {
          transforms.push(`translateX(${offsetX}px)`);
          zIndex++;
        }
        if (!cell.classList.contains('sticky-scroll-y')) {
          transforms.push(`translateY(${offsetY}px)`);
          zIndex++;
        }
        if (cell.parentNode.parentNode.tagName === 'THEAD') zIndex = zIndex + 10;
        if (cell.tagName === 'TH') zIndex = zIndex + 5;
        cell.style.transform = transforms.join(' ');
        cell.style.zIndex = zIndex;
        // cell.style.transform = `translateX(${offsetX}px) translateY(${offsetY}px)`;        
      });
    }

    function calculatePosition({currentPosition: { scrollX, scrollY, maxX, maxY }, deltaX, deltaY}) {
      let newX = scrollX + deltaX;
      let newY = scrollY + deltaY;

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
      return {newX, newY};
    }


    // $sc.off('scroll.stickyTable', scrollHandler).on('scroll.stickyTable', function (event) {
    //   if ($scTable.height() > $sc.height()) {
    //     scrollHandler($offsetElems, $sc)
    //   }
    // });

    // if ($sc.scrollTop() > 0) {
    //   scrollHandler($offsetElems, $sc)
    // }    

    // ------------------------------

    // let old = [];
    // old.forEach(function () {
    //   var $sc = $(this);
    //   if ($sc.find('tbody').length === 0) {
    //     console.error($sc, "must be called on a <div> that includes a table with a <tbody> element.");
    //     return;
    //   }
    //   $sc.addClass('sticky-table-wrapper');
    //   if (typeof $sc.data('scroll-x') === 'undefined') {
    //     $sc.data('scroll-x', 0);
    //   }
    //   if (typeof $sc.data('scroll-y') === 'undefined') {
    //     $sc.data('scroll-y', 0);
    //   }

    //   function backgroundColor(styles, elem) {
    //     let color;
    //     if (styles.backgroundColor.replace(/\s/g, '') === 'rgba(0,0,0,0)') {
    //       const rowColor = getComputedStyle(elem.parentNode).backgroundColor;
    //       if (rowColor.replace(/\s/g, '') === 'rgba(0,0,0,0)') {
    //         return '#fff';
    //       } else {
    //         return rowColor;
    //       }
    //     } else {
    //       return styles.backgroundColor;
    //     }
    //   }



    //   var $offsetElems = $sc.find('.sticky');
    //   var $scTable = $sc.find('table');

    //   var table = $scTable[0];
    //   var wrapper = $sc[0];
    //   var tableBox = table.getBoundingClientRect();
    //   var wrapperBox = wrapper.getBoundingClientRect();
    //   $sc.data('max-x', tableBox.width - wrapper.clientWidth);
    //   $sc.data('max-y', tableBox.height - wrapper.clientHeight);
    //   console.log('max-y', $sc.data('max-y'));



    //   // TODO : Would be good to have better touch handling for iOS/Android
    //   // element.addEventListener("touchstart", touchStart, false);
    //   // element.addEventListener("touchmove", touchMove, false);

    //   // Typically when scrolling and then calculating/repositioning an absolutely positioned element we get a lot of jitter
    //   // as the element is drawn to the page. This is because the events are "Scroll -> Calculate -> Position".
    //   // To fix this, have created a synthetic scroll event that tracks the amount of scroll wheel movement, then calculates
    //   // the new position, positioning the element, and finially scrolls the containing element.

    //   function wheelHandler($sc, $scTable, event) {
    //     const scBox = $sc[0].getBoundingClientRect();
    //     const scTableBox = $scTable[0].getBoundingClientRect();
    //     // console.log(scBox, scTableBox)
    //     if (scTableBox.height > scBox.height || scTableBox.width > scBox.width) {
    //       if (
    //         ($sc.scrollTop() > 0 && $scTable.height() > ($sc.scrollTop() + $sc.height())) || ($sc.scrollTop() === 0 && event.originalEvent.deltaY > 0)
    //         ||
    //         ($sc.scrollLeft() > 0 && $scTable.width() > ($sc.scrollLeft() + $sc.width())) || ($sc.scrollLeft() === 0 && event.originalEvent.deltaX > 0)
    //       ) {
    //         event.preventDefault();
    //         calculatePosition($sc, $scTable, $offsetElems, event.originalEvent.deltaX, event.originalEvent.deltaY);
    //       }
    //     }
    //   }

    //   function positionHeader($elems, scrollX, scrollY) {
    //     var transformation, shadow, shadowOffset;
    //     $elems.css({
    //       //  top: scrollY + 'px',
    //       //  bottom: -scrollY + 'px',
    //       //  left: scrollX + 'px',
    //       //  right: -scrollX + 'px'
    //       transform: `translate(${scrollX}px, ${scrollY}px)`
    //     });
    //   }
  
    //   function calculatePosition($sc, $scTable, $offsetElems, changeX, changeY) {
    //     var existingX = $sc.data('scroll-x');
    //     var existingY = $sc.data('scroll-y');
    //     var maxX = $sc.data('max-x');
    //     var maxY = $sc.data('max-y');
    //     var newX = existingX + changeX;
    //     var newY = existingY + changeY;
    //     console.log('newY', newY, maxY)
  
    //     if (newX < 0) {
    //       newX = 0;
    //     } else if (newX > maxX) {
    //       newX = maxX;
    //     }
    //     if (newY < 0) {
    //       newY = 0;
    //     } else if (newY > maxY) {
    //       newY = maxY;
    //       console.log('newY reset', newY, maxY)
    //     }
  
    //     $sc.data({ 'scroll-x': newX, 'scroll-y': newY });
    //     $sc.scrollLeft(newX);
    //     $sc.scrollTop(newY);
    //     positionHeader($offsetElems, newX, newY);
    //   }
        
    //   $sc.off('wheel.stickyTable mousewheel.stickyTable', wheelHandler).on('wheel.stickyTable mousewheel.stickyTable', function (event) {
    //     wheelHandler($sc, $scTable, event);
    //   });

    //   function scrollHandler($offsetElems, $sc) {
    //     $sc.data({ 'scroll-x': $sc.scrollLeft(), 'scroll-y': $sc.scrollTop() });
    //     positionHeader($offsetElems, $sc.scrollTop());
    //   }

    //   $sc.off('scroll.stickyTable', scrollHandler).on('scroll.stickyTable', function (event) {
    //     if ($scTable.height() > $sc.height()) {
    //       scrollHandler($offsetElems, $sc)
    //     }
    //   });

    //   if ($sc.scrollTop() > 0) {
    //     scrollHandler($offsetElems, $sc)
    //   }

    // });

    return this;
  };

}(jQuery));