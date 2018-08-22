(function($) {
  const fnName = 'ahaTooltip';
  const disabledName = `${fnName}Disabled`;

  $.fn[fnName] = function(opts = {}) {

    const popperDefaults = {
      placement: 'auto',
      positionFixed: false,
      eventsEnabled: true,
      removeOnDestroy: false,
      modifiers: {
        arrow: {
          element: ".tooltip-arrow, .tooltip__arrow"
        },
        offset: {
          offset: 0
        }
      },
      preventOverflow: {
        boundariesElement: "scrollView"
      }
    }

    function mergeData($elem, newData = {}) {
      const oldData = $elem.data(fnName) || {};
      const mergedData = Object.assign(oldData, newData);
      $elem.data(fnName, mergedData);
    }

    // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    function mutationCallback(tooltip, mutations, observer) {
      mutations.forEach((mutation) => {
        const value = mutation.target.getAttribute(mutation.attributeName);
        tooltip.updateTitleContent(value);
        if (mutation.attributeName === 'title') {
          mutation.target.dataset.title = mutation.target.title;
          mutation.target.removeAttribute('title');
          observer.takeRecords();
        }
      });
    }

    function stripScripts(str) {
      if (!str) return
      const dom = new DOMParser().parseFromString(str, 'text/html');
      const body = dom.body;
      const scripts = body.querySelectorAll('script');
      Array.from(scripts).forEach((script) => script.remove());
      return body.innerHTML;
    }

    function updateTooltipContent($elem, opts) {
      const tooltip = $elem.data(fnName);
      const elem = $elem[0];
      let title = elem.title || elem.dataset.title || elem.dataset.tooltip;
      let content = elem.dataset.content;

      elem.removeAttribute('title');

      const popper = tooltip.instance.popper;
      const titleElem = popper.querySelector('[x-title]');
      const contentElem = popper.querySelector('[x-content]');
      if (tooltip.opts.html) {
        titleElem.innerHTML = stripScripts(title);
        contentElem.innerHTML = stripScripts(content);
      } else {
        titleElem.textContent = title;
        contentElem.textContent = content;
      }

      // const data = $elem.data(fnName);
      // data.instance.popper = popper;
      // mergeData($elem, data);
    }

    function createTooltip($triggerElem, opts) {
      const template = $(opts.template)[0];
      const tooltip = new Popper($triggerElem, template, opts.popper);
      const data = { instance: tooltip, enabled: true, opts };
      $triggerElem.data(fnName, data);
      updateTooltipContent($triggerElem, opts);
      return data;
    }

    function appendTooltipElem(tooltip) {
      $(tooltip.opts.container).append(tooltip.instance.popper);
    }

    function openTooltip($triggerElem, opts) {
      const tooltip = $triggerElem.data(fnName) || createTooltip($triggerElem, opts);
      if (tooltip.enabled) {
        tooltip.isVisible = true;
        appendTooltipElem(tooltip)
      }
    }

    function closeTooltip($triggerElem) {
      const tooltip = $triggerElem.data(fnName);
      tooltip.isVisible = false;
      // Remove the popper's DOM node.
      tooltip.instance.popper.remove();
    }

    if (typeof opts !== 'string') {
      // Set context and selector for event assignment.
      let context, selector;
      if (this.selector) {
        context = this.selector;
      } else {
        context = document;
        selector = opts.selector;
      }

      opts.popper = popperDefaults;
      opts.html = opts.html || false;
      opts.template = opts.template || `<div class="tooltip" role="tooltip">
        <div class="tooltip-arrow"></div>
        <div class="tooltip-inner">
          <div class="tooltip-title" x-title></div>
          <div class="tooltip-content" x-content></div>
        </div>
      </div>`;
      
      // Object.assign({
      //   base: 'tooltip',
      //   separator: '-',
      //   get html: `<div class="${this.base}" role="tooltip">
      //     <div class="${this.base}${this.separator}arrow" data-arrow></div>
      //     <div class="${this.base}${this.separator}inner">
      //       <div class="${this.base}${this.separator}title"></div>
      //       <div class="${this.base}${this.separator}content"></div>
      //     </div>
      //   </div>`,
      // }, opts.template);

      const { trigger } = opts;
      const [ onEvent, offEvent ] = (function(trigger) {
        switch (trigger) {
          case 'click':
            return ['click'];
          case 'focus':
            return ['focus', 'blur'];
          case 'hover':
          default:
            return ['mouseenter', 'mouseleave'];
        }
      })(trigger);


      if (offEvent) {
        $(context).on(onEvent, selector, (e) => {
          // createTooltip($(e.currentTarget));
          openTooltip($(e.currentTarget), opts);
        }).on(offEvent, (e) => {
          closeTooltip($(e.currentTarget))
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const $triggerElem = $(e.currentTarget);
          const tooltip = $triggerElem.data(fnName);
          if (tooltip && tooltip.isVisible) {
            closeTooltip($triggerElem);
          } else {
            openTooltip($triggerElem, opts);
          }
        });
      }
    } else {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            const tooltip = $(elem).data(fnName);
            if (tooltip) {
              $(tooltip.opts.container).append(tooltip.instance.popper);
            }
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            const $triggerElem = $(elem);
            if ($triggerElem.data(fnName)) {
              closeTooltip($triggerElem);
            }
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            const $triggerElem = $(elem)
            const tooltip = $triggerElem.data(fnName);
            if (tooltip) {
              mergeData($triggerElem, { enabled: true });
            }
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            const $triggerElem = $(elem)
            const tooltip = $triggerElem.data(fnName);
            if (tooltip) {
              mergeData($triggerElem, { enabled: false });
            }
          });
          break;
        case 'dispose':
          this.each((i, elem) => {
            const $triggerElem = $(elem)
            const tooltip = $triggerElem.data(fnName);
            tooltip.instance.destroy();
            $triggerElem.removeData(fnName);
          });
          break;
        default:
          return;
      }
    }

    return this;
  };
}(jQuery));
