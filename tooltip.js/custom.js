(function($) {
  // WeakMap of DOM nodes to tooltip instance. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

  $.fn.ahaTooltip = function(opts = {}) {
    function getRef(elem) {
      return refs.get(elem) || {};
    }

    function setRef(elem, data) {
      const currentData = getRef(elem);
      const mergedData = Object.assign(currentData, data);
      refs.set(elem, mergedData);
      return mergedData;
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
      const ref = getRef(elem);
      const title = elem.title || elem.dataset.title || elem.dataset.tooltip;
      const content = elem.dataset.content;

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

    function createTooltip(triggerElem) {
      const ref = getRef(triggerElem);
      const template = $(ref.opts.template)[0];
      const tooltip = new Popper(triggerElem, template, ref.opts.popper);
      // const data = { instance: tooltip, enabled: true, opts };
      // refs.set(triggerElem, data);
      setRef(triggerElem, { instance: tooltip, enabled: true })
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

    function openTooltip(triggerElem) {
      const ref = getRef(triggerElem);
      if (!ref.instance) {
        createTooltip(triggerElem);
      }
      appendTooltip(triggerElem);
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
      ref.instance.popper.remove();
      delete ref.fadeOut;
    }

    function closeTooltip(triggerElem, delayHide) {
      triggerElem.removeAttribute('x-tooltip');
      const ref = getRef(triggerElem);
      if (ref.instance) {
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
      return triggerArr(opts).reduce((acc, trigger) => {
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

    function triggerArr(opts) {
      return opts.trigger.split(' ').map(x => x.trim());
    }

    function setInlineOpts() {
      // $(context).on('mouseenter focus', selector, function boo(e) {
      //   $(context).off('mouseenter mouseleave focus', selector, boo);
      //   console.log('---all events');

      // });
    }

    function bindEvents(context, selector, opts) {

      const events = getOnOffEvents(opts);
      events.forEach((event) => {
        const [ onEvent, offEvent] = event;
        if (offEvent) {
          $(context).on(onEvent, selector, function onHandler(e) {
            console.log('onEvent', onEvent);
            // const inlineOpts = e.currentTarget.dataset;
            // opts = deepmerge(opts, inlineOpts);
            // // console.log(opts.trigger, inlineOpts.trigger)
            // // if (inlineOpts.trigger && inlineOpts.trigger !== onEvent) {
            // //   delete inlineOpts.trigger;
            // //   $(context).off(onEvent, selector, onHandler);
            // //   bindEvents(context, selector, opts);

            // if (inlineOpts.trigger) {
            //   // const inlineTriggers = getOnOffEvents(inlineOpts);
            //   // const unmatchedEvents = events.filter((evt) => !inlineTriggers.includes(evt));
            //   // debugger
            //   delete e.currentTarget.dataset.trigger;
            //   $(context).off(onEvent, selector, onHandler);
            //   bindEvents(context, selector, opts);
            // } else {

              // -----------------
              const inlineOpts = Object.assign({}, e.currentTarget.dataset);
              Object.keys(inlineOpts).forEach(key => {
                try {
                  opts[key] = JSON.parse(inlineOpts[key]);
                } catch {
                  opts[key] = inlineOpts[key]
                }
                delete e.currentTarget.dataset[key];
              });
              setRef(e.currentTarget, { opts });
              console.log('opts', opts)
              if (inlineOpts.trigger) {
                bindEvents(context, selector, opts);
              } else {
                openTooltip(e.currentTarget);
              }
              // ----------------
            // }
          }).on(offEvent, selector, function offHandler(e) {
            console.log('offEvent', offEvent);
            // const inlineOpts = e.currentTarget.dataset;
            // opts = deepmerge(opts, inlineOpts);
            // if (inlineOpts.trigger && inlineOpts.trigger !== onEvent) {
            //   delete inlineOpts.trigger;
            //   $(context).off(offEvent, selector, offHandler);
            // } else {
              closeTooltip(e.currentTarget);
            // }
          });
        } else {
          $(context).on(onEvent, selector, (e) => {
            const ref = getRef(e.currentTarget);
            if (ref && ref.isVisible) {
              closeTooltip(e.currentTarget);
            } else {
              setRef(e.currentTarget, { opts });
              openTooltip(e.currentTarget);
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
        trigger: 'hover focus',
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
