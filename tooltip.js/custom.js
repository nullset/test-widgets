(function($) {
  // WeakMap of DOM nodes to tooltip instance. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

  $.fn.ahaTooltip = function(opts = {}) {
    function getTooltip(elem) {
      return refs.get(elem);
    }

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
      const tooltip = getTooltip(elem);
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
      const tooltip = getTooltip(triggerElem);
      if (tooltip) {
        tooltip.instance.update();
      }
    }

    function openTooltip(triggerElem, opts) {
      if (!getTooltip(triggerElem)) {
        createTooltip(triggerElem, opts);
      }
      appendTooltip(triggerElem);
    }

    function appendTooltip(triggerElem) {
      const tooltip = getTooltip(triggerElem);
      if (tooltip && tooltip.enabled) {
        clearTimeout(tooltip.timeout);
        tooltip.isVisible = true;
        tooltip.timeout = setTimeout(() => {
          triggerElem.setAttribute('x-tooltip', '');
          repositionTooltip(triggerElem);
          const container = tooltip.opts.container ? document.querySelector(tooltip.opts.container) : triggerElem;
          container.appendChild(tooltip.instance.popper);
          requestAnimationFrame(() => tooltip.instance.popper.setAttribute('x-in', ''));
        }, tooltip.opts.delay.show);
      }
    }

    function fadeTooltipOut(tooltip) {
      tooltip.instance.popper.removeEventListener('transitionend', tooltip.fadeOut);
      tooltip.instance.popper.remove();
      delete tooltip.fadeOut;
    }

    function closeTooltip(triggerElem, delayHide) {
      triggerElem.removeAttribute('x-tooltip');
      const tooltip = getTooltip(triggerElem);
      if (tooltip) {
        clearTimeout(tooltip.timeout);
        tooltip.isVisible = false;
        tooltip.fadeOut = fadeTooltipOut(tooltip);
        tooltip.timeout = setTimeout(() => {
          tooltip.instance.popper.addEventListener('transitionend', tooltip.fade);
          tooltip.instance.popper.removeAttribute('x-in');
        }, typeof delayHide === 'undefined' ? tooltip.opts.delay.hide : delayHide);
      }
    }

    function enableTooltip(triggerElem) {
      const tooltip = getTooltip(triggerElem);
      if (tooltip) {
        tooltip.enabled = true;
      }
    }

    function disableTooltip(triggerElem) {
      closeTooltip(triggerElem, 0);
      const tooltip = getTooltip(triggerElem);
      if (tooltip) {
        tooltip.enabled = false;
      }
    }

    function destroyTooltip(triggerElem) {
      closeTooltip(triggerElem, 0);
      const tooltip = getTooltip(triggerElem);
      if (tooltip) {
        tooltip.instance.destroy();
        refs.delete(triggerElem);
      }
    }

    function getOnOffEvents(opts) {
      return [ onEvent, offEvent ] = (function(trigger) {
        switch (trigger) {
          case 'click':
            return ['click'];
          case 'focus':
            return ['focus', 'blur'];
          case 'hover':
            return ['mouseenter', 'mouseleave'];
          default:
            return ['mouseenter', 'mouseleave'];
        }
      })(opts.trigger);
    }

    function rebindEvents(triggerElem, opts) {

    }

    function bindEvents(context, selector, opts) {
      const [ onEvent, offEvent] = getOnOffEvents(opts);
      if (offEvent) {
        $(context).on(onEvent, selector, (e) => {
          console.log('onEvent', onEvent);
          const inlineOpts = e.currentTarget.dataset;
          opts = deepmerge(opts, inlineOpts);
          if (inlineOpts.trigger) {
            $(context).off(onEvent, selector);
            bindEvents(context, selector, opts);
            return;
          }
          openTooltip(e.currentTarget, opts);
        }).on(offEvent, selector, (e) => {
          console.log('offEvent', offEvent);
          const inlineOpts = e.currentTarget.dataset;
          opts = deepmerge(opts, inlineOpts);
          if (inlineOpts.trigger) {
            $(context).off(offEvent, selector);
            return;
          }
          closeTooltip(e.currentTarget);
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const tooltip = getTooltip(e.currentTarget);
          if (tooltip && tooltip.isVisible) {
            closeTooltip(e.currentTarget);
          } else {
            openTooltip(e.currentTarget, opts);
          }
        });
      }
    }

    const popperDefaults = {
      placement: 'auto',
      positionFixed: false,
      eventsEnabled: true,
      removeOnDestroy: false,
      modifiers: {
        arrow: {
          element: '.aha-tooltip__arrow',
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

      const ahaTooltipDefaults = {
        popper: popperDefaults,
        html: false,
        delay: {
          show: 0,
          hide: 0,
        }
      }

      opts = deepmerge(ahaTooltipDefaults, opts);

      const defaultTemplate = `<div class="${['aha-tooltip', opts.type ? `aha-tooltip--${opts.type}` : ''].join(' ').trim()}" role="tooltip">
        <div class="aha-tooltip__arrow"></div>
        <div class="aha-tooltip__inner">
          <div class="aha-tooltip__title" x-title></div>
          <div class="aha-tooltip__content" x-content></div>
        </div>
      </div>`;
      opts.template = opts.template || defaultTemplate;

      bindEvents(context, selector, opts);
    } else {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            appendTooltip(elem);
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            closeTooltip(elem, 0);
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
