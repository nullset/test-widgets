(function($) {
  const namespace = 'AhaTooltip';

  // ---------- DEFAULT SETTINGS ----------
  const defaultSettings = {
    allowUnsafe: false,
    cache: false,
    class: undefined,
    container: undefined,
    content: undefined,
    delay: {
      show: 0,
      hide: 0,
    },
    html: false,
    placement: undefined,
    popper: {
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
        hide: {
          enabled: true,
        },
      },
      preventOverflow: {
        boundariesElement: 'scrollView',
      },
    },
    selector: undefined,
    template: undefined,
    title: undefined,
    trigger: 'hover focus',
    type: undefined,
    url: undefined,
  };


  // ---------- TOOLTIP FACTORY ----------
  const AhaTooltip = function(triggerElem, opts) {
    this.type = opts.type;
    this.triggerElem = triggerElem;
    this.opts = opts;
    this.enabled = true;
    this.isVisible = false;
    this.createTooltip(triggerElem, opts);
  };

  AhaTooltip.prototype.openTooltip = function() {
    const data = AhaTooltip.prototype.getData(this.triggerElem);
    const self = this;

    // Close any other type of tooltip that is open for this triggering element.
    Object.keys(data).forEach((type) => {
      if (type !== self.opts.type && type !== 'popper') {
        data[type].tooltip.closeTooltip(0);
      }
    });
    this.getContents();

    this.appendTooltip();
  };

  AhaTooltip.prototype.appendTooltip = function() {
    if (this.enabled) {
      clearTimeout(this.timeout);
      this.isVisible = true;
      this.timeout = setTimeout(() => {
        if (this.isVisible) {
          this.triggerElem.setAttribute('x-tooltip', '');
          this.repositionTooltip(this.triggerElem, this.type);
          const container = this.opts.container ? document.querySelector(this.opts.container) : this.triggerElem;
          container.appendChild(this.popper.popper);
          requestAnimationFrame(() => {
            if (!this.popper.popper.hasAttribute('x-in')) {
              this.popper.popper.setAttribute('x-in', '');
            }
          });
        }
      }, this.opts.delay.show || 0);
    }
  };

  AhaTooltip.prototype.getTemplate = function() {
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
  };

  AhaTooltip.prototype.createTooltip = function() {
    const template = this.getTemplate();

    if (this.opts.placement) {
      this.opts.popper.placement = this.opts.placement;
    }

    this.popper = new Popper(this.triggerElem, template, this.opts.popper);

    const data = this.data = AhaTooltip.prototype.getData(this.triggerElem);
    data[this.type] = {
      tooltip: this,
      popper: this.popper,
    };

    this.setData(data);

    // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
    // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
    // and have those changes automatically reflected in the tooltip popup.
    this.titleContentMutationObserver = new MutationObserver(this.titleContentMutationCallback.bind(this, data, this.opts.type));
    this.titleContentMutationObserver.observe(this.triggerElem, {
      attributes: true,
      attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
    });

    this.triggerElemMutationObserver = new MutationObserver(this.triggerElemMutationCallback.bind(this, this.triggerElem));
    this.triggerElemMutationObserver.observe(this.triggerElem.parentNode, {
      childList: true,
    });
  };

  AhaTooltip.prototype.setPreventEventExcept = function(eventName) {
    const data = this.getData(this.triggerElem);
    Object.defineProperty(data, 'preventEventExcept', {
      value: eventName,
      enumerable: false,
      configurable: true,
    });
  };

  AhaTooltip.prototype.clearPreventEventExcept = function() {
    const data = this.getData(this.triggerElem);
    delete data.preventEventExcept;
  };

  AhaTooltip.prototype.getContents = function() {
    new Promise((resolve, reject) => {
      if (this.opts.url && (!this.opts.content || this.opts.cache === false)) {
        this.popper.popper.removeAttribute('x-loading-error');
        this.popper.popper.setAttribute('x-loading', '');
        this.opts.content = '<i class="fa fa-refresh fa-spin fa-lg"></i>';
        this.updateTooltipContent(this.triggerElem, this.type);
        $.ajax({
          url: this.opts.url,
          success: (data) => {
            this.opts.content = data;
          },
          error: (data) => {
            this.popper.popper.setAttribute('x-loading-error', '');
          },
          complete: (data) => {
            this.popper.popper.removeAttribute('x-loading');
            resolve();
          },
        });
      } else {
        resolve();
      }
    }).then(() => {
      this.updateTooltipContent(this.triggerElem, this.type);
    });
  };

  // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
  AhaTooltip.prototype.titleContentMutationCallback = function(tooltip, type, mutations, observer) {
    mutations.forEach((mutation) => {
      let newValue = mutation.target.getAttribute(mutation.attributeName);
      let value;
      try {
        newValue = JSON.parse(newValue);
        value = typeof newValue === 'object' ? newValue[type] : newValue;
      } catch (e) {
        value = newValue;
      }

      if (mutation.attributeName === 'data-content') {
        tooltip[type].tooltip.opts.content = value;
      } else {
        tooltip[type].tooltip.opts.title = value;
        if (mutation.attributeName === 'title') {
          mutation.target.dataset.title = value;
          mutation.target.removeAttribute('title');
        }
      }
      this.updateTooltipContent(mutation.target, type);
      observer.takeRecords();
    });
  };

  // Watch for triggerElem removals, when that happens destroy the tooltip and remove the observer.
  AhaTooltip.prototype.triggerElemMutationCallback = function(triggerElem, mutations, observer) {
    mutations.forEach((mutation) => {
      if (Array.from(mutation.removedNodes).includes(triggerElem)) {
        this.destroyTooltip();
        observer.disconnect();
      }
    });
  };

  AhaTooltip.prototype.updateTooltipContent = function() {
    const { title, content } = this.opts;
    const titleElem = this.popper.popper.querySelector('[x-title]');
    const contentElem = this.popper.popper.querySelector('[x-content]');

    if (this.opts.html) {
      if (this.opts.allowUnsafe) {
        // Pass any HTML through without modification.
        titleElem.innerHTML = title || '';
        contentElem.innerHTML = content || '';
      } else {
        // Remove any suspect tags/attributes/attribute values.
        titleElem.innerHTML = this.cleanHTML(title) || '';
        contentElem.innerHTML = this.cleanHTML(content) || '';
      }
    } else {
      // Render as plain text, without parsing any HTML.
      titleElem.textContent = title || '';
      contentElem.textContent = content || '';
    }
    this.popper.update();
  };

  // Escaping dangerous HTML content **SHOULD** be done server-side, however, people occasionally forget to do this.
  // `cleanHTML` serves as a measure of last resort, removing explicitly dangerous tags, removing any non-whitelisted attributes,
  // and ensuring that any references to external files point to actual external references (not inline JS).
  AhaTooltip.prototype.cleanHTML = function(str) {
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
  };



  AhaTooltip.prototype.repositionTooltip = function() {
    this.popper.update();
  };

  AhaTooltip.prototype.closeTooltip = function(delayHide) {
    const self = this;
    if (self.popper) {
      clearTimeout(self.timeout);
      if (self.isVisible) {
        self.triggerElem.removeAttribute('x-tooltip');
        self.isVisible = false;
        self.timeout = setTimeout(() => {
          if (!self.isVisible) {
            self.popper.popper.addEventListener('transitionend', function fadeOut() {
              self.popper.popper.removeEventListener('transitionend', fadeOut);
              if (self.popper.popper.parentNode && !self.isVisible) {
                self.popper.popper.parentNode.removeChild(self.popper.popper);
              }
            });
          }
        }, typeof delayHide === 'undefined' ? self.opts.delay.hide : delayHide);
        self.popper.popper.removeAttribute('x-in');
      }
    }
  };

  AhaTooltip.prototype.enableTooltip = function() {
    this.enabled = true;
  };

  AhaTooltip.prototype.disableTooltip = function() {
    this.closeTooltip(0);
    this.enabled = false;
  };

  AhaTooltip.prototype.destroyTooltip = function() {
    this.closeTooltip(0);
    const data = AhaTooltip.prototype.getData(this.triggerElem);
    delete data[this.type];
  };

  AhaTooltip.prototype.getOnOffEvents = function(opts) {
    return AhaTooltip.prototype.triggers(opts).reduce((acc, trigger) => {
      if (trigger === 'click') {
        acc.push(['click']);
      } else if (trigger === 'focus') {
        acc.push(['focus', 'blur']);
      } else if (trigger === 'hover') {
        acc.push(['mouseenter', 'mouseout']);
      }
      return acc;
    }, []);
  };

  AhaTooltip.prototype.triggers = function(opts) {
    return opts.trigger.split(' ').map(x => x.trim());
  };

  AhaTooltip.prototype.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  AhaTooltip.prototype.parseValue = function(value) {
    try {
      return JSON.parse(value);
    } catch(e) {
      return value;
    }
  };

  AhaTooltip.prototype.mergeInlineOpts = function(elem, opts = {}) {
    Object.keys(defaultSettings).forEach((key) => {
      if (key === 'popper') return;
      let value;
      const dataKey = `${opts.type}${AhaTooltip.prototype.capitalizeFirstLetter(key)}`;
      if (key === 'title') {
        value = elem.dataset[dataKey] || elem.dataset.tooltip || elem.getAttribute(key) || opts[key];
      } else {
        value = elem.dataset[dataKey] || opts[key];
      }
      opts[key] = AhaTooltip.prototype.parseValue(value);
    });
    return opts;
  };

  AhaTooltip.prototype.getData = function(elem) {
    return $.data(elem)[namespace] || {};
  };

  AhaTooltip.prototype.setData = function(data) {
    $.data(this.triggerElem)[namespace] = data;
  };

  AhaTooltip.prototype.getTooltip = function(triggerElem, type) {
    const data = AhaTooltip.prototype.getData(triggerElem);
    return data[type] && data[type].tooltip;
  };

  AhaTooltip.prototype.getOrCreateTooltip = function(triggerElem, opts) {
    opts = AhaTooltip.prototype.mergeInlineOpts(triggerElem, opts);
    return AhaTooltip.prototype.getTooltip(triggerElem, opts.type) || new AhaTooltip(triggerElem, opts);
  };

  AhaTooltip.prototype.bindEvents = function(context, selector, opts) {
    const events = AhaTooltip.prototype.getOnOffEvents(opts);
    events.forEach((event) => {
      const [ onEvent, offEvent ] = event;
      if (offEvent) {
        $(context).on(onEvent, selector, (e) => {
          const tooltip = AhaTooltip.prototype.getOrCreateTooltip(e.currentTarget, Object.assign({}, opts));
          if (!tooltip.data.preventEventExcept || tooltip.data.preventEventExcept === onEvent) {
            tooltip.openTooltip();
          }
        }).on(offEvent, selector, (e) => {
          const tooltip = AhaTooltip.prototype.getOrCreateTooltip(e.currentTarget, Object.assign({}, opts));
          if (!tooltip.data.preventEventExcept || tooltip.data.preventEventExcept === offEvent) {
            const triggerElem = e.currentTarget;

            if (triggerElem.contains(e.relatedTarget)) return;
            if (offEvent === 'mouseout' && e.relatedTarget === tooltip.popper.popper) {
              $(tooltip.popper.popper).on('mouseout', function mouseLeaveHandler(mouseoutEvent) {
                if (!tooltip.popper.popper.contains(mouseoutEvent.relatedTarget) && !triggerElem.contains(mouseoutEvent.relatedTarget)) {
                  tooltip.closeTooltip();
                  $(tooltip.popper.popper).off('mouseleave', mouseLeaveHandler);
                }
              });
            } else {
              tooltip.closeTooltip();
            }
          }
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const triggerElem = e.currentTarget;
          const tooltip = AhaTooltip.prototype.getOrCreateTooltip(triggerElem, Object.assign({}, opts));
          if (!tooltip.data.preventEventExcept || tooltip.data.preventEventExcept === onEvent) {
            if (tooltip.isVisible) {
              tooltip.closeTooltip();
              tooltip.clearPreventEventExcept();
            } else {
              tooltip.openTooltip();
              tooltip.setPreventEventExcept(onEvent);
              requestAnimationFrame(() => {
                $(document).on(onEvent, function handleClickOutside(clickOutsideEvent) {
                  const selectroModal = document.querySelector('#selectro-modal');
                  if (triggerElem === clickOutsideEvent.target) {
                    $(document).off(onEvent, handleClickOutside);
                  } else {
                    if (!tooltip.popper.popper.contains(clickOutsideEvent.target) && (!selectroModal || !selectroModal.contains(clickOutsideEvent.target))) {
                      $(document).off(onEvent, handleClickOutside);
                      tooltip.closeTooltip();
                      tooltip.clearPreventEventExcept();
                    }
                  }
                });
              });
            }
          }
        });
      }
    });
  };

  AhaTooltip.prototype.createManualTooltips = function(context, selector, opts) {
    $(`${context} ${selector || ''}`).each((i, elem) => {
      AhaTooltip.prototype.getOrCreateTooltip(elem, opts);
    });
  };

  AhaTooltip.prototype.manualTypeMutationCallback = function(context, selector, opts, mutations) {
    AhaTooltip.prototype.createManualTooltips(context, selector, opts);
  };

  AhaTooltip.prototype.setup = function(opts, type) {
    // Set context and selector for event assignment.
    let context, selector;
    if (this.selector) {
      context = this.selector;
    } else {
      context = document;
      selector = opts.selector;
    }

    if (typeof opts !== 'string') {
      opts.type = type;
      opts = deepmerge(defaultSettings, opts);

      // This type of tooltip will only ever be controlled by manual show/hide controls.
      if (opts.trigger === 'manual') {
        if (selector) {
          // If a selector is specified, watch for any additional triggers added to the page.
          const observer = new MutationObserver(AhaTooltip.prototype.manualTypeMutationCallback.bind(this, context, selector, opts));
          observer.observe(document.querySelector('body'), {
            childList: true,
            subtree: true,
          });
        }
        AhaTooltip.prototype.createManualTooltips(context, selector, opts);
      } else {
        AhaTooltip.prototype.bindEvents(context, selector, opts);
      }
    } else {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            const tooltip = AhaTooltip.prototype.getTooltip(elem, type);
            if (tooltip) tooltip.openTooltip();
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            const tooltip = AhaTooltip.prototype.getTooltip(elem, type);
            if (tooltip) tooltip.closeTooltip(0);
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            const tooltip = AhaTooltip.prototype.getTooltip(elem, type);
            if (tooltip) tooltip.enableTooltip();
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            const tooltip = AhaTooltip.prototype.getTooltip(elem, type);
            if (tooltip) tooltip.disableTooltip();
          });
          break;
        case 'dispose':
        case 'destroy':
          this.each((i, elem) => {
            const tooltip = AhaTooltip.prototype.getTooltip(elem, type);
            if (tooltip) tooltip.destroyTooltip();
          });
          break;
        default:
      }
    }
  };

  $.fn.tooltip = function(opts = {}) {
    AhaTooltip.prototype.setup.call(this, opts, 'tooltip');
    return this;
  };

  $.fn.popover = function(opts = {}) {
    AhaTooltip.prototype.setup.call(this, opts, 'popover');
    return this;
  };
}(jQuery));
