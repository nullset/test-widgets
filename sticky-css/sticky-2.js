
(function ($) {

  $.fn.stickyTable = function (args) {
    this.each(() => {
      const $table = this;
      const table = $table[0];
      const tableStyles = window.getComputedStyle(table);
      const $wrapper = wrapTable($table, tableStyles);
      const wrapper = $wrapper[0];
      const $stickyElems = $table.find('th.sticky, td.sticky');

      // Variable that tracks whether "wheel" event was called.
      // Prevents both "wheel" and "scroll" events being triggered simultaneously.
      let wheelEventTriggered = false;

      // Set initial scrolled value.
      wrapper.dataset.scrollX = 0;
      wrapper.dataset.scrollY = 0;      

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
        wheelHandler(event, wrapper, $wrapper, $stickyElems);
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

      // Wrap existing table inside wrapper.
      $table.wrap($wrapper);

      // Determine just how much the wrapper can be scrolled.
      // setMaxScrollValues($table)
      
      return $table.parent();
    }

    function wheelHandler(event, wrapper, $wrapper, $stickyElems) {
      const { deltaX, deltaY } = event.originalEvent;
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = wrapper;
      let maxWidth = scrollWidth - clientWidth;
      let maxHeight = scrollHeight - clientHeight;

      let { scrollX, scrollY } = wrapper.dataset;
      let newX = parseInt(scrollX, 10) + deltaX;
      let newY = parseInt(scrollY, 10) + deltaY;
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
        wrapper.classList.add('--is-scrolling');
      } else {
        wrapper.classList.remove('--is-scrolling');
      }
      wrapper.dataset.scrollX = newX;
      wrapper.dataset.scrollY = newY;
      // $wrapper.scrollLeft(newX).scrollTop(newY);
      wrapper.scrollLeft = newX;
      wrapper.scrollTop = newY;
      positionStickyElements($stickyElems, newX, newY);
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

    // function wheelHandler($table, $wrapper, $stickyElems, event) {
    //   const {deltaX, deltaY} = event.originalEvent;
    //   if ($table.height() > $wrapper.height() || $table.width() > $wrapper.width()) {
    //     if (
    //       ($wrapper.scrollTop() > 0 && $table.height() > ($wrapper.scrollTop() + $wrapper.height())) || ($wrapper.scrollTop() === 0 && deltaY > 0)
    //       ||
    //       ($wrapper.scrollLeft() > 0 && $table.width() > ($wrapper.scrollLeft() + $wrapper.width())) || ($wrapper.scrollLeft() === 0 && deltaX > 0)
    //     ) {
    //       event.preventDefault();
    //       const {newX, newY} = calculatePosition({currentPosition: $wrapper.data(), deltaX, deltaY});
    //       $wrapper.scrollLeft(newX);
    //       $wrapper.scrollTop(newY);
    //       updateScrollPosition($wrapper, $stickyElems, newX, newY);
    //     }
    //   }
    // }

    function scrollHandler($stickyElems, offsetX, offsetY) {
      requestAnimationFrame(() => {
        console.log('scroll fired');
        updateScrollPosition($stickyElems, offsetX, offsetY);
      });
    }

    function updateScrollPosition($stickyElems, offsetX, offsetY) {
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

    return this;
  };

}(jQuery));