(function($) {
  // WeakMap of DOM nodes to tooltip instance. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

  $.fn.ahaTooltip = function(opts = {}) {

    // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    function mutationCallback(tooltip, mutations, observer) {
      mutations.forEach((mutation) => {
        updateTooltipContent(mutation.target);
        observer.takeRecords();
      });
    }

    // Escaping dangerous HTML content **SHOULD** be done server-side, however, people occasionally forget to do this.
    // `cleanHTML` serves as a measure of last resort, removing explicitly dangerous tags, removing any non-whitelisted attributes,
    // and ensuring that any references to external files point to actual external references (not inline JS).
    function cleanHTML(str) {
      if (!str) return;
      const dom = new DOMParser().parseFromString(str, 'text/html');
      const body = dom.body;
      const elems = dom.body.querySelectorAll('*');

      for (const node of elems) {
        // Strip any <script>/<iframe> tags as those can open us up to XSS.
        if (/^(script|iframe|style)$/i.test(node.nodeName)) {
          node.remove();
        } else {
          for (const attr of node.attributes) {
            // Strip any attribute with "javascript:" in the value.
            if (/(j|&#106;|&#74;)avascript:/i.test(attr.value)) {
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

    function updateTooltipContent(elem) {
      const tooltip = refs.get(elem);
      const title = elem.title || elem.dataset.title || elem.dataset.tooltip;
      const content = elem.dataset.content;

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

    function createTooltip(triggerElem, opts) {
      const template = $(opts.template)[0];
      const tooltip = new Popper(triggerElem, template, opts.popper);
      const data = { instance: tooltip, enabled: true, opts };
      refs.set(triggerElem, data);
      updateTooltipContent(triggerElem);


      // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
      // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
      // and have those changes automatically reflected in the tooltip popup.
      const observer = new MutationObserver(mutationCallback.bind(null, tooltip));
      observer.observe(triggerElem, {
        attributes: true,
        attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
      });
    }

    function repositionTooltip(triggerElem) {
      const tooltip = refs.get(triggerElem);
      if (tooltip) {
        tooltip.instance.update();
      }
    }

    function openTooltip(triggerElem, opts) {
      triggerElem.setAttribute('x-tooltip', '');
      if (!refs.get(triggerElem)) {
        createTooltip(triggerElem, opts);
      }
      appendTooltip(triggerElem);
    }

    function appendTooltip(triggerElem) {
      const tooltip = refs.get(triggerElem);
      if (tooltip && tooltip.enabled) {
        tooltip.isVisible = true;
        repositionTooltip(triggerElem);
        const container = tooltip.opts.container ? document.querySelector(tooltip.opts.container) : triggerElem;
        container.appendChild(tooltip.instance.popper);
      }
    }

    function closeTooltip(triggerElem) {
      triggerElem.removeAttribute('x-tooltip');
      const tooltip = refs.get(triggerElem);
      if (tooltip) {
        tooltip.isVisible = false;
        tooltip.instance.popper.remove();
      }
    }

    function enableTooltip(triggerElem) {
      const tooltip = refs.get(triggerElem);
      if (tooltip) {
        tooltip.enabled = true;
      }
    }

    function disableTooltip(triggerElem) {
      closeTooltip(triggerElem);
      const tooltip = refs.get(triggerElem);
      if (tooltip) {
        tooltip.enabled = false;
      }
    }

    function destroyTooltip(triggerElem) {
      closeTooltip(triggerElem);
      const tooltip = refs.get(triggerElem);
      if (tooltip) {
        tooltip.instance.destroy();
        refs.delete(triggerElem);
      }
    }

    const popperDefaults = {
      placement: 'auto',
      positionFixed: false,
      eventsEnabled: true,
      removeOnDestroy: false,
      modifiers: {
        arrow: {
          element: '.tooltip-arrow, .tooltip__arrow',
        },
        offset: {
          offset: 0,
        },
      },
      preventOverflow: {
        boundariesElement: 'viewScroll'
      },
    };

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
          openTooltip(e.currentTarget, opts);
        }).on(offEvent, (e) => {
          closeTooltip(e.currentTarget);
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const tooltip = refs.get(e.currentTarget);
          if (tooltip && tooltip.isVisible) {
            closeTooltip(e.currentTarget);
          } else {
            openTooltip(e.currentTarget, opts);
          }
        });
      }
    } else {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            appendTooltip(elem);
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            closeTooltip(elem);
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            enableTooltip(elem);
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            disableTooltip(elem);
          });
          break;
        case 'dispose':
          this.each((i, elem) => {
            destroyTooltip(elem);
          });
          break;
        default:
          return;
      }
    }

    return this;
  };
}(jQuery));
