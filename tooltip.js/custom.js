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

    // Escaping dangerous HTML content **SHOULD** be done server-side, however, people occasionally forget to do this.
    // `cleanHTML` serves as a measure of last resort, removing explicitly dangerous tags, removing any non-whitelisted attributes,
    // and ensuring that any references to external files point to actual external references (not inline JS).
    function cleanHTML(str) {
      if (!str) return
      const dom = new DOMParser().parseFromString(str, 'text/html');
      const body = dom.body;
      const elems = dom.body.querySelectorAll('*');

      for (let node of elems) {
        // Strip any <script>/<iframe> tags as those can open us up to XSS.
        if (/^(script|iframe|style)$/i.test(node.nodeName)) {
          node.remove();
        } else {
          for (let attr of node.attributes) {
            // Strip any attribute with "javascript:" in the value.
            if (/(j|&#106;|&#74;)avascript:/i.test(attr.value)) {
              debugger
              node.removeAttribute(attr.name);
            } else if (/href|src|srcset/i.test(attr.name)) {
              // Strip any href, src, srcset attribute that does not start with `http://` or `https://`.
              if (!/^https?:\/\//i.test(attr.value)) {
                node.removeAttribute(attr.name);
              }
            } else {
              // Strip any attributes that are not class, id, title, alt, width, or height.
              if (!/class|id|title|alt|width|height/i.test(attr.name)) {
                node.removeAttribute(attr.name);
              }
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
        titleElem.innerHTML = cleanHTML(title) || '';
        contentElem.innerHTML = cleanHTML(content) || '';
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
      opts.type = opts.type || 'tooltip';
      opts.template = opts.template || `<div class="${opts.type}" role="tooltip">
        <div class="${opts.type}-arrow"></div>
        <div class="${opts.type}-inner">
          <div class="${opts.type}-title" x-title></div>
          <div class="${opts.type}-content" x-content></div>
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
