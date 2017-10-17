
(function ($) {

  $.fn.stickyTable = function (args) {
    this.each(() => {
      const $table = this;
      const table = $table[0];
      const tableStyles = window.getComputedStyle(table);
      const $wrapper = wrapTable($table, tableStyles);
      const wrapper = $wrapper[0];
      const stickyElems = table.querySelectorAll('th[class*="sticky--is-stuck"], td[class*="sticky--is-stuck"]');

      // Variable that tracks whether "wheel" event was called.
      // Prevents both "wheel" and "scroll" events being triggered simultaneously.
      let wheelEventTriggered = false;

      // Set initial scrolled value.
      // Use .setAttribute rather that .data() or .dataset for massive speed boost.
      // https://jsperf.com/dataset-vs-jquery-data
      wrapper.setAttribute('data-scroll-left', 0);
      wrapper.setAttribute('data-scroll-top', 0);      

      // Set initial position of elements to 0.
      positionStickyElements(stickyElems);

      stickyElems.forEach((cell) => {
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
        wheelHandler(event, wrapper, $wrapper, stickyElems);
    });

      $wrapper.off('scroll.stickyTable', scrollHandler).on('scroll.stickyTable', () => {
        if (wheelEventTriggered) {
          wheelEventTriggered = false;
        } else {
          scrollHandler(wrapper, stickyElems);
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

      return $table.parent();
    }

    function wheelHandler(event, wrapper, $wrapper, stickyElems) {
      const { deltaX, deltaY } = event.originalEvent;
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = wrapper;
      const maxWidth = scrollWidth - clientWidth;
      const maxHeight = scrollHeight - clientHeight;
      const scrollLeft = parseInt(wrapper.getAttribute('data-scroll-left'), 10);
      const scrollTop = parseInt(wrapper.getAttribute('data-scroll-top'), 10);
      let newX = scrollLeft + deltaX;
      let newY = scrollTop + deltaY;
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
        wrapper.classList.add('sticky--is-scrolling');
      } else {
        wrapper.classList.remove('sticky--is-scrolling');
      }
      wrapper.setAttribute('data-scroll-left', newX);
      wrapper.setAttribute('data-scroll-top', newY);
      wrapper.scrollLeft = newX;
      wrapper.scrollTop = newY;
      positionStickyElements(stickyElems, newX, newY);
    }

    function scrollHandler(wrapper, stickyElems) {
      requestAnimationFrame(() => {
        updateScrollPosition(wrapper, stickyElems);
      });
    }

    function updateScrollPosition(wrapper, stickyElems) {
      wrapper.setAttribute('data-scroll-left', wrapper.scrollLeft);
      wrapper.setAttribute('data-scroll-top', wrapper.scrollTop);
      positionStickyElements(stickyElems, wrapper.scrollLeft, wrapper.scrollTop);
    }

    function calculateShadow(offset) {
      let shadow = offset/10;
      let max = 6;
      let min = 3;
      if (shadow > max) return max;
      if (shadow < min) return min;
      return shadow;
    }

    function positionStickyElements(elems, offsetX = 0, offsetY = 0) {
      elems.forEach((cell) => {
        let shadowX = calculateShadow(offsetX);
        let shadowY = calculateShadow(offsetY);
        let transforms = [];
        cell.style.setProperty(`--box-shadow`, `${shadowX}px ${shadowY}px ${shadowX}px rgba(0,0,0,0.15), ${shadowX}px ${shadowY}px ${shadowY}px  rgba(0,0,0,0.15)`);
        if (!cell.classList.contains('sticky--is-stuck-y') || cell.classList.contains('sticky--is-stuck')) {
          transforms.push(`translateX(${offsetX}px)`);
        }
        if (!cell.classList.contains('sticky--is-stuck-x') || cell.classList.contains('sticky--is-stuck')) {
          transforms.push(`translateY(${offsetY}px)`);
        }
        cell.style.transform = transforms.join(' ');
      });
    }

    return this;
  };

}(jQuery));