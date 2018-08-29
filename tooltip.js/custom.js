(function($) {
  const namespace = 'ahaTooltips';
  // WeakMap of DOM nodes to tooltip instances. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  // const refs = new WeakMap();

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



  // -----------------------------------------
  class Tooltip  {
    constructor(triggerElem, opts) {
      this.type = opts.type;
      this.triggerElem = triggerElem;
      this.opts = opts;
      this.enabled = true;
      this.isVisible = false;
      this.createTooltip(triggerElem, opts);
    }
  }


  Tooltip.prototype.openTooltip = function() {
    const triggerElem = this.triggerElem;
    const opts = this.opts;
    const data = $(triggerElem).data(namespace);
    // debugger

    // Close any other type of tooltip that is open for this triggering element.
    Object.keys(data).forEach(function(type) {
      if (type !== opts.type && type !== 'popper') {
        data[type].tooltip.closeTooltip(0);
      }
    })

    // Append this type of tooltip to the page.
    this.appendTooltip();
  }

  Tooltip.prototype.appendTooltip = function() {
    const triggerElem = this.triggerElem;
    const type = this.type;

    if (this.enabled) {
      clearTimeout(this.timeout);
      this.isVisible = true;
      this.timeout = setTimeout(() => {
        triggerElem.setAttribute('x-tooltip', '');
        this.repositionTooltip(triggerElem, type);
        const container = this.opts.container ? document.querySelector(this.opts.container) : triggerElem;
        container.appendChild(this.popper.popper);
        requestAnimationFrame(() => {
          if (!this.popper.popper.hasAttribute('x-in')) {
            this.popper.popper.setAttribute('x-in', '');
          }
        });
      }, this.opts.delay && this.ops.delay.show || 0);
    }
  }

  Tooltip.prototype.getTemplate = function() {
    const $template = this.opts.template
      ? $(this.opts.template)
      : $(`<div class="${['aha-tooltip', `aha-tooltip--${this.type || 'default'}`, this.opts.class || ''].join(' ').trim()}" role="tooltip">
      <div class="aha-tooltip__arrow"></div>
      <div class="aha-tooltip__inner">
        <div class="aha-tooltip__title" x-title></div>
        <div class="aha-tooltip__content" x-content></div>
      </div>
    </div>`);
    return $template[0];
  }

  Tooltip.prototype.createTooltip = function() {
    const template = this.getTemplate();
    const type = this.type;
    const opts = this.opts;
    if (opts.placement) {
      opts.popper.placement = opts.placement;
    }

    this.popper = new Popper(this.triggerElem, template, opts.popper);

    const data = getData(this.triggerElem);
    data[this.type] = {
      tooltip: this,
      popper: this.popper,
    }
    $(this.triggerElem).data(namespace, data);

    const self = this;
    const resolveURL = new Promise(function(resolve, reject) {
      if (self.opts.url) {
        self.popper.popper.removeAttribute('x-loading-error');
        self.popper.popper.setAttribute('x-loading', '');
        self.opts.content = '<i class="fa fa-spinner fa-spin"></i>';
        self.updateTooltipContent(self.triggerElem, self.type);
        $.ajax({
          url: self.opts.url,
          success: (data) => {
            self.opts.content = data;
          },
          error: (data) => {
            self.popper.popper.setAttribute('x-loading-error', '');
          },
          complete: (data) => {
            self.popper.popper.removeAttribute('x-loading');
            resolve();
          }
        });
      } else {
        resolve();
      }
    }).then(() => {
      self.updateTooltipContent(self.triggerElem, type);
    });

    // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
    // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
    // and have those changes automatically reflected in the tooltip popup.
    const observer = new MutationObserver(this.mutationCallback.bind(this, data, opts.type));
    observer.observe(this.triggerElem, {
      attributes: true,
      attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
    });
  }

  // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
  Tooltip.prototype.mutationCallback = function(tooltip, type, mutations, observer) {
    mutations.forEach((mutation) => {
      const newValue = mutation.target.getAttribute(mutation.attributeName);
      if (mutation.attributeName === 'data-content') {
        tooltip[type].tooltip.opts.content = newValue;
      } else {
        tooltip[type].tooltip.opts.title = newValue;
        if (mutation.attributeName === 'title') {
          mutation.target.dataset.title = newValue;
          mutation.target.removeAttribute('title');
        }
      }
      this.updateTooltipContent(mutation.target, type);
      observer.takeRecords();
    });
  }

  Tooltip.prototype.updateTooltipContent = function() {
    const elem = this.triggerElem;

    const {title, content} = this.opts;
    const titleElem = this.popper.popper.querySelector('[x-title]');
    const contentElem = this.popper.popper.querySelector('[x-content]');

    if (this.opts.html) {
      titleElem.innerHTML = this.cleanHTML(title) || '';
      contentElem.innerHTML = this.cleanHTML(content) || '';
    } else {
      titleElem.textContent = title || '';
      contentElem.textContent = content || '';
    }
    this.popper.update();
  }

  // Escaping dangerous HTML content **SHOULD** be done server-side, however, people occasionally forget to do this.
  // `cleanHTML` serves as a measure of last resort, removing explicitly dangerous tags, removing any non-whitelisted attributes,
  // and ensuring that any references to external files point to actual external references (not inline JS).
  Tooltip.prototype.cleanHTML = function(str) {
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



  Tooltip.prototype.repositionTooltip = function() {
    this.popper.update();
  }

  Tooltip.prototype.closeTooltip = function(delayHide) {
    const self = this;
    if (self.popper) {
      clearTimeout(self.timeout);
      if (self.isVisible) {
        self.triggerElem.removeAttribute('x-tooltip');
        self.isVisible = false;
        self.timeout = setTimeout(() => {
          self.popper.popper.addEventListener('transitionend', function fadeOut() {
            self.popper.popper.removeEventListener('transitionend', fadeOut);
            if (self.popper.popper.parentNode) {
              self.popper.popper.parentNode.removeChild(self.popper.popper);
            }
          });
        }, typeof delayHide === 'undefined' ? self.opts.delay.hide : delayHide);
        self.popper.popper.removeAttribute('x-in');
      }
    }
  }

  Tooltip.prototype.enableTooltip = function() {
    this.enabled = true;
  }

  Tooltip.prototype.disableTooltip = function() {
    this.closeTooltip(0);
    this.enabled = false;
  }

  Tooltip.prototype.destroyTooltip = function() {
    this.closeTooltip(0);
    const ref = getRef(this.triggerElem);
    if (ref[this.type]) {
      ref[this.type].instance.destroy();
      delete ref[this.type];
      // If this is the last type of tooltip for the element, delete the WeakMap reference.
      if (Object.keys(ref).length === 0) {
        // TODO:
        refs.delete(this.triggerElem);
      }
    }
  }

  function getOnOffEvents(opts) {
    return triggers(opts).reduce((acc, trigger) => {
      if (trigger === 'click') {
        acc.push(['click']);
      } else if (trigger === 'focus') {
        acc.push(['focus', 'blur']);
      } else if (trigger === 'hover') {
        acc.push(['mouseenter', 'mouseout']);
      }
      return acc;
    }, []);
  }

  function triggers(opts) {
    return opts.trigger.split(' ').map(x => x.trim());
  }

  function mergeInlineOpts(elem, opts = {}) {
    // Move legacy data-tooltip, title attributes to data-title.
    if (elem.dataset.tooltip) {
      elem.dataset.title = elem.dataset.tooltip;
      delete elem.dataset.tooltip;
    }
    if (elem.title) {
      elem.dataset.title = elem.title;
      elem.removeAttribute('title');
    }

    Object.keys(Object.assign({}, elem.dataset)).forEach((key) => {
      let value = elem.dataset[key];
      try {
        value = JSON.parse(value.replace(/'/g, '"'));
        if (Array.isArray(value) || key === 'delay') {
          opts[key] = value;
        } else {
          if (typeof value[opts.type] !== 'undefined') {
            opts[key] = value[opts.type];
          }
        }
      } catch {
        opts[key] = value;
      }
    });
    return opts;
  }

  function getData(elem) {
    const $elem = elem.nodeType ? $(elem) : elem;
    let data = $.data(elem)[namespace]  || {};
    // NOTE: Returns a live object. Mutations to this object are immediately reflected in the data structure.
    return data
  }

  function getTooltip(triggerElem, opts) {
    const data = getData(triggerElem);
    opts = mergeInlineOpts(triggerElem, opts);
    return data[opts.type] ? data[opts.type].tooltip : new Tooltip(triggerElem, opts);
  }

  function bindEvents(context, selector, opts) {
    const events = getOnOffEvents(opts);
    events.forEach((event) => {
      const [ onEvent, offEvent ] = event;
      if (offEvent) {
        $(context).on(onEvent, selector, (e) => {
          const tooltip = getTooltip(e.currentTarget, opts);
          tooltip.openTooltip();
        }).on(offEvent, selector, (e) => {
          const tooltip = getTooltip(e.currentTarget, opts);
          const triggerElem = e.currentTarget

          if (triggerElem.contains(e.relatedTarget)) return;
          if (offEvent === 'mouseout' && e.relatedTarget === tooltip.popper.popper) {
            $(tooltip.popper.popper).on('mouseout', function mouseLeaveHandler(e2) {
              if (!tooltip.popper.popper.contains(e2.relatedTarget) && !triggerElem.contains(e2.relatedTarget)) {
                tooltip.closeTooltip();
                $(tooltip.popper.popper).off('mouseleave', mouseLeaveHandler);
              }
            });
          } else {
            tooltip.closeTooltip();
          }
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const tooltip = getTooltip(e.currentTarget, opts);
          let handleClickOutside;
          if (tooltip.isVisible) {
            tooltip.closeTooltip();
          } else {
            tooltip.openTooltip();
            requestAnimationFrame(() => {
              $(document).on(onEvent, function handleClickOutside(e2) {
                if (!tooltip.popper.popper.contains(e2.target)) {
                  $(document).off(onEvent, handleClickOutside);
                  tooltip.closeTooltip();
                }
              })
            })
          }
        });
      }
    });
  }

  function setup(opts) {
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
            const tooltip = getTooltip(elem, opts);
            tooltip.openTooltip();
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
  }
  //-----------------

  $.fn.ahaTooltip = function(opts = {}) {
    opts.type = 'tooltip';
    setup.call(this, opts);
    return this;
  };

  $.fn.popover = function(opts = {}) {
    opts.type = 'popover';
    setup.call(this, opts);
    return this;
  };
}(jQuery));
