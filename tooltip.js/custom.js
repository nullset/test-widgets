(function($) {
  // WeakMap of DOM nodes to tooltip instances. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

  $.fn.ahaTooltip = function(opts = {}) {
    function getRef(elem) {
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
          node.parentNode.removeChild(node);
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
      const ref = getRef(elem);
      const title = ref.opts.title || elem.title || elem.dataset.title || elem.dataset.tooltip;
      const content = ref.opts.content || elem.dataset.content;

      if (elem.title.length > 0) {
        elem.dataset.title = elem.title;
        elem.removeAttribute('title');
      }

      const popper = ref.instance.popper;
      const titleElem = popper.querySelector('[x-title]');
      const contentElem = popper.querySelector('[x-content]');
      if (ref.opts.html) {
        titleElem.innerHTML = cleanHTML(title) || '';
        contentElem.innerHTML = cleanHTML(content) || '';
      } else {
        titleElem.textContent = title || '';
        contentElem.textContent = content || '';
      }
    }

    function getTemplate(opts) {
      const $template = opts.template
        ? $(opts.template)
        : $(`<div class="${['aha-tooltip', `aha-tooltip--${opts.type || 'default'}`, opts.class || ''].join(' ').trim()}" role="tooltip">
        <div class="aha-tooltip__arrow"></div>
        <div class="aha-tooltip__inner">
          <div class="aha-tooltip__title" x-title></div>
          <div class="aha-tooltip__content" x-content></div>
        </div>
      </div>`);
      return $template[0];
    }

    function createTooltip(triggerElem, opts) {
      const template = getTemplate(opts);
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
      const ref = getRef(triggerElem);
      if (ref) {
        ref.instance.update();
      }
    }

    function openTooltip(triggerElem, opts) {
      new Promise(function(resolve, reject) {
        const ref = getRef(triggerElem);
        if (!getRef(triggerElem)) {
          if (opts.url) {
            triggerElem.removeAttribute('x-loading-error');
            triggerElem.setAttribute('x-loading', '');
            $.ajax({
              url: opts.url,
              success: (data) => {
                opts.content = data;
                createTooltip(triggerElem, opts);
                resolve();
              },
              error: (data) => {
                triggerElem.setAttribute('x-loading-error', '');
              },
              complete: () => {
                triggerElem.removeAttribute('x-loading');
              }
            })
          } else {
            createTooltip(triggerElem, opts);
            resolve();
          }
        } else {
          resolve();
        }
      }).then(() => {
        appendTooltip(triggerElem);
      })
    }

    function appendTooltip(triggerElem) {
      const ref = getRef(triggerElem);
      if (ref && ref.enabled) {
        clearTimeout(ref.timeout);
        ref.isVisible = true;
        ref.timeout = setTimeout(() => {
          triggerElem.setAttribute('x-tooltip', '');
          repositionTooltip(triggerElem);
          const container = ref.opts.container ? document.querySelector(ref.opts.container) : triggerElem;
          container.appendChild(ref.instance.popper);
          requestAnimationFrame(() => ref.instance.popper.setAttribute('x-in', ''));
        }, ref.opts.delay.show);
      }
    }

    function fadeTooltipOut(ref) {
      ref.instance.popper.removeEventListener('transitionend', ref.fadeOut);
      ref.instance.popper.parentNode.removeChild(ref.instance.popper);
      delete ref.fadeOut;
    }

    function closeTooltip(triggerElem, delayHide) {
      triggerElem.removeAttribute('x-tooltip');
      const ref = getRef(triggerElem);
      if (ref) {
        clearTimeout(ref.timeout);
        ref.isVisible = false;
        ref.fadeOut = fadeTooltipOut(ref);
        ref.timeout = setTimeout(() => {
          ref.instance.popper.addEventListener('transitionend', ref.fadeOut);
          ref.instance.popper.removeAttribute('x-in');
        }, typeof delayHide === 'undefined' ? ref.opts.delay.hide : delayHide);
      }
    }

    function enableTooltip(triggerElem) {
      const ref = getRef(triggerElem);
      if (ref) {
        ref.enabled = true;
      }
    }

    function disableTooltip(triggerElem) {
      closeTooltip(triggerElem, 0);
      const ref = getRef(triggerElem);
      if (ref) {
        ref.enabled = false;
      }
    }

    function destroyTooltip(triggerElem) {
      closeTooltip(triggerElem, 0);
      const ref = getRef(triggerElem);
      if (ref) {
        ref.instance.destroy();
        refs.delete(triggerElem);
      }
    }

    function getOnOffEvents(opts) {
      // TODO: Need to handle touch events.
      return triggers(opts).reduce((acc, trigger) => {
        if (trigger === 'click') {
          acc.push(['click']);
        } else if (trigger === 'focus') {
          acc.push(['focus', 'blur']);
        } else if (trigger === 'hover') {
          acc.push(['mouseenter', 'mouseleave']);
        }
        return acc;
      }, []);
    }

    function triggers(opts) {
      return opts.trigger.split(' ').map(x => x.trim());
    }

    function bindEvents(context, selector, opts) {
      getOnOffEvents(opts).forEach((event) => {
        const [ onEvent, offEvent ] = event;
        if (offEvent) {
          $(context).on(onEvent, selector, (e) => {
            openTooltip(e.currentTarget, opts);
          }).on(offEvent, selector, (e) => {
            closeTooltip(e.currentTarget);
          });
        } else {
          $(context).on(onEvent, selector, (e) => {
            const ref = getRef(e.currentTarget);
            if (ref && ref.isVisible) {
              closeTooltip(e.currentTarget);
            } else {
              openTooltip(e.currentTarget, opts);
            }
          });
        }
      });
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
        boundariesElement: 'window',
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
        trigger: 'hover focus',
        delay: {
          show: 0,
          hide: 0,
        },
      };

      // Moving placement option to the popper object.
      if (opts.placement) {
        opts.popper = opts.popper || {};
        opts.popper.placement = opts.placement;
        delete opts.placement;
      }

      opts = deepmerge(ahaTooltipDefaults, opts);

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
