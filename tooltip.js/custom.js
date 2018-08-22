(function($) {
  const fnName = 'ahaTooltip';

  $.fn[fnName] = function(opts = {}) {

    // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    function mutationCallback(tooltip, mutations, observer) {
      mutations.forEach((mutation) => {
        updateTooltipContent($(mutation.target));
        observer.takeRecords();
      });
    }

    // Strip any <script>/<iframe> tags as those can open us up to XSS.
    // Strip any attribute with a "javascript:" value for the same reason.
    function stripScripts(str) {
      if (!str) return
      const dom = new DOMParser().parseFromString(str, 'text/html');
      const body = dom.body;
      const elems = dom.body.querySelectorAll('*');

      for (let node of elems) {
        if (/^(SCRIPT|IFRAME)$/.test(node.nodeName.toUpperCase())) {
          node.remove();
        } else {
          for (let attr of node.attributes) {
            if (/javascript:/.test(attr.value)) {
              node.removeAttribute(attr.name);
            }
          }
        }
      }
      return body.innerHTML;
    }

    function setInnerHTML(element, str = '') {
      element.innerHTML = str;
    }

    function updateTooltipContent($elem) {
      const tooltip = $elem.data(fnName);
      const elem = $elem[0];
      let title = elem.title || elem.dataset.title || elem.dataset.tooltip;
      let content = elem.dataset.content;

      if (elem.title.length > 0) {
        elem.dataset.title = elem.title;
        elem.removeAttribute('title');
      }

      const popper = tooltip.instance.popper;
      const titleElem = popper.querySelector('[x-title]');
      const contentElem = popper.querySelector('[x-content]');
      if (tooltip.opts.html) {
        titleElem.innerHTML = stripScripts(title) || '';
        contentElem.innerHTML = stripScripts(content) || '';
      } else {
        titleElem.textContent = title || '';
        contentElem.textContent = content || '';
      }
    }

    function createTooltip($triggerElem, opts) {
      const template = $(opts.template)[0];
      const tooltip = new Popper($triggerElem, template, opts.popper);
      const data = { instance: tooltip, enabled: true, opts };
      $triggerElem.data(fnName, data);
      updateTooltipContent($triggerElem);


      // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
      // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
      // and have those changes automatically reflected in the tooltip popup.
      var observer = new MutationObserver(mutationCallback.bind(null, tooltip));
      observer.observe($triggerElem[0], {
        attributes: true,
        attributeFilter: ["title", "data-tooltip", "data-title", "data-content"],
      });

      return data;
    }

    function appendTooltipElem(tooltip) {
      $(tooltip.opts.container).append(tooltip.instance.popper);
    }

    function openTooltip($triggerElem, opts) {
      const tooltip = $triggerElem.data(fnName) || createTooltip($triggerElem, opts);
      if (tooltip.enabled) {
        tooltip.instance.update();
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
              tooltip.enabled = true;
            }
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            const $triggerElem = $(elem)
            const tooltip = $triggerElem.data(fnName);
            if (tooltip) {
              tooltip.enabled = false;
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
