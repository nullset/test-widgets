(function($) {
  // WeakMap of DOM nodes to tooltip instances. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

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

  const ahaTooltipDefaults = {
    popper: popperDefaults,
    html: false,
    trigger: 'hover focus',
    type: 'tooltip',
    delay: {
      show: 0,
      hide: 0,
    },
  };

  $.fn.ahaTooltip = function(opts = {}) {
    function getRef(elem) {
      return refs.get(elem) || {};
    }

    function getType(elem, type) {
      const ref = getRef(elem);
      return ref[type] || {};
    }

    function setRef(elem, newData) {
      const currentData = getRef(elem) || {};
      const mergedData = Object.assign(currentData, newData);
      refs.set(elem, mergedData);
      return mergedData;
    }

    function setType(elem, type, newTypeData) {
      const allData = getRef(elem);
      const currentTypeData = allData[type] || {};
      const mergedTypeData = Object.assign(currentTypeData, newTypeData);
      const typeData = {};
      typeData[type] = mergedTypeData;
      setRef(elem, typeData);
      return mergedTypeData;
    }

    // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    function mutationCallback(tooltip, type, mutations, observer) {
      mutations.forEach((mutation) => {
        updateTooltipContent(mutation.target, type);
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

    function updateTooltipContent(elem, type) {
      const ref = getType(elem, type);
      const title = ref.opts.title || elem.title || elem.dataset.title || elem.dataset.tooltip;
      const content = ref.opts.content;

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
      ref.instance.update();
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
      const type = opts.type;
      // TODO: need to handle placement again
      if (opts.placement) {
        opts.popper.placement = opts.placement;
      }

      const tooltip = new Popper(triggerElem, template, opts.popper);
      const typeData = { instance: tooltip, enabled: true, opts  };
      // TODO: need to set type within overall data


      setType(triggerElem, opts.type, typeData);

      const resolveURL = new Promise(function(resolve, reject) {
        if (typeData.opts.url) {
          typeData.instance.popper.removeAttribute('x-loading-error');
          typeData.instance.popper.setAttribute('x-loading', '');
          typeData.opts.content = '<i class="fa fa-spinner fa-spin"></i>';
          updateTooltipContent(triggerElem, type);
          setTimeout(() => {
            $.ajax({
              url: typeData.opts.url,
              success: (data) => {
                typeData.opts.content = data;
              },
              error: (data) => {
                typeData.instance.popper.setAttribute('x-loading-error', '');
              },
              complete: (data) => {
                typeData.instance.popper.removeAttribute('x-loading');
                resolve();
                // resolve(typeData);
                // setType(triggerElem, type, typeData);
              }
            })

          }, 3000);
        } else {
          resolve();
        }
      }).then(() => {

        updateTooltipContent(triggerElem, type);

      });
      
      // resolveURL.then((typeData) => {
      //   // debugger

        // debugger
        // setType(triggerElem, type, typeData);
        // updateTooltipContent(triggerElem, type);
      // });
      


      // // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
      // // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
      // // and have those changes automatically reflected in the tooltip popup.
      // const observer = new MutationObserver(mutationCallback.bind(null, tooltip, opts.type));
      // observer.observe(triggerElem, {
      //   attributes: true,
      //   attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
      // });
    }

    function repositionTooltip(triggerElem, type) {
      const ref = getType(triggerElem, type);
      if (ref) {
        ref.instance.update();
      }
    }

    function openTooltip(triggerElem, opts) {
      const ref = getRef(triggerElem);
      const refType = getType(triggerElem, opts.type);

      Object.keys(ref).forEach((type) => {
        if (type !== opts.type) {
          closeTooltip(triggerElem, type, 0);
        }
      })

      if (Object.keys(refType).length === 0) {
        createTooltip(triggerElem, opts);
      }
      // refs.set(triggerElem, opts);

      appendTooltip(triggerElem, opts.type);
    }

    function appendTooltip(triggerElem, type) {
      const ref = getType(triggerElem, type);
      if (ref && ref.enabled) {
        clearTimeout(ref.timeout);
        ref.isVisible = ref.isVisible || {}
        ref.isVisible[ref.opts.type] = true;
        ref.timeout = setTimeout(() => {
          triggerElem.setAttribute('x-tooltip', '');
          repositionTooltip(triggerElem, type);
          const container = ref.opts.container ? document.querySelector(ref.opts.container) : triggerElem;
          container.appendChild(ref.instance.popper);
          requestAnimationFrame(() => ref.instance.popper.setAttribute('x-in', ''));
        }, ref.opts.delay.show);
      }
    }

    function fadeTooltipOut(ref) {
      ref.instance.popper.removeEventListener('transitionend', ref.fadeOut);
      if (ref.instance.popper.parentNode) {
        ref.instance.popper.parentNode.removeChild(ref.instance.popper);
        delete ref.fadeOut;
      }
    }

    function closeTooltip(triggerElem, type, delayHide) {
      triggerElem.removeAttribute('x-tooltip');
      const ref = getType(triggerElem, type);
      if (ref) {
        clearTimeout(ref.timeout);
        ref.isVisible = false;
        ref.fadeOut = fadeTooltipOut.bind(null, ref);
        ref.timeout = setTimeout(() => {
          ref.instance.popper.addEventListener('transitionend', ref.fadeOut);
          ref.instance.popper.removeAttribute('x-in');
        }, typeof delayHide === 'undefined' ? ref.opts.delay.hide : delayHide);
      }
    }

    function enableTooltip(triggerElem, type = 'tooltip') {
      const ref = getType(triggerElem, type);
      if (ref) {
        ref.enabled = true;
      }
    }

    function disableTooltip(triggerElem, type = 'tooltip') {
      closeTooltip(triggerElem, type, 0);
      const ref = getType(triggerElem, type);
      if (ref) {
        ref.enabled = false;
      }
    }

    function destroyTooltip(triggerElem) {
      closeTooltip(triggerElem, type, 0);
      const ref = getType(triggerElem, type);
      if (ref) {
        ref.instance.destroy();
        // TODO: NEEDS A TYPE OPTION
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
          // acc.push(['mouseenter', 'mouseleave']);
          acc.push(['mouseenter', 'mouseout']);
        }
        return acc;
      }, []);
    }

    function triggers(opts) {
      return opts.trigger.split(' ').map(x => x.trim());
    }

    function mergeInlineOpts(elem, opts = {}) {
      Object.keys(Object.assign({}, elem.dataset)).forEach((key) => {
        let value = elem.dataset[key];
        try {
          value = JSON.parse(value.replace(/'/g, '"'));
          if (Array.isArray(value) || key === 'delay') {
            opts[key] = value;
          } else {
            if (value[opts.type]) {
              opts[key] = value[opts.type];
            }
          }
        } catch {
          opts[key] = value;
        }
      });
      return opts;
    }

    function bindEvents(context, selector, opts) {
      const events = getOnOffEvents(opts);
      events.forEach((event) => {
        const [ onEvent, offEvent ] = event;
        if (offEvent) {
          $(context).on(onEvent, selector, (e) => {
            opts = mergeInlineOpts(e.currentTarget, opts);
            openTooltip(e.currentTarget, opts);
          }).on(offEvent, selector, (e) => {
            const elem = e.currentTarget;
            opts = mergeInlineOpts(elem, opts);
            const ref = getType(elem, opts.type);
            // debugger
            if (elem.contains(e.relatedTarget)) return;
            if (offEvent === 'mouseout' && e.relatedTarget === ref.instance.popper) {
              $(ref.instance.popper).on('mouseleave', function mouseLeaveHandler(e) {
                console.log('leave')
                closeTooltip(elem, opts.type);
                $(ref.instance.popper).off('mouseleave', mouseLeaveHandler);
              });
            } else {
              closeTooltip(elem, opts.type);
            }
          });
        } else {
          $(context).on(onEvent, selector, (e) => {
            const ref = getRef(e.currentTarget);
            opts = mergeInlineOpts(e.currentTarget, opts);
            if (ref && ref[opts.type] && ref[opts.type].isVisible) {
              closeTooltip(e.currentTarget, opts.type);
            } else {
              openTooltip(e.currentTarget, opts);
            }
          });
        }
      });
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


      opts = deepmerge(ahaTooltipDefaults, opts);

      bindEvents(context, selector, opts);
    } else {
      const defaultType = 'tooltip';
      const defaultOpts = {opts: ahaTooltipDefaults};
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            opts = mergeInlineOpts(elem, defaultOpts);
            openTooltip(elem, opts.type || defaultType);
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            opts = mergeInlineOpts(elem, defaultOpts);
            closeTooltip(elem, opts.type || defaultType, 0);
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            opts = mergeInlineOpts(elem, defaultOpts);
            enableTooltip(elem, opts.type || defaultType);
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            opts = mergeInlineOpts(elem, defaultOpts);
            disableTooltip(elem, opts.type || defaultType);
          });
          break;
        case 'dispose':
          this.each((i, elem) => {
            opts = mergeInlineOpts(elem, defaultOpts);
            destroyTooltip(elem, opts.type || defaultType);
          });
          break;
        default:
          return;
      }
    }

    return this;
  };
}(jQuery));
