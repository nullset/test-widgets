(function($) {
  // WeakMap of DOM nodes to tooltip instances. Using WeakMap allows values to be garbage collected when
  // the element which forms the "key" is removed from the DOM.
  const refs = new WeakMap();

  class Tooltip  {
    constructor( triggerElem, opts ) {
      this.type = opts.type;
      this.triggerElem = triggerElem;
      const instance = {};
      instance[this.typetype] = {opts};
      // this.ref = refs.set(triggerElem, instance);
      this.opts = opts;
      this.enabled = true;
      this.isVisible = false;
      // this.refType = this.ref[type] || {opts};

      const refData = {};
      refData[this.type] = this;
      refs.set(triggerElem, refData);
      // this.openTooltip();
    }
  }

  Tooltip.prototype.getRef = function() {
    return refs.get(elem) || {};
  }

  Tooltip.prototype.blah = function() {
    debugger
  }

  Tooltip.prototype.openTooltip = function() {
    const ref = refs.get(this.triggerElem);
    const triggerElem = this.triggerElem;
    const opts = this.opts;

    // Close any other type of tooltip that is open for this triggering element.
    Object.keys(ref).forEach(function(type) {
      if (type !== opts.type) {
        const refType = ref[type];
        refType.closeTooltip(0);
      }
    })

    // If the triggering element does not have this type of tooltip, create it.
    // if (Object.keys(refType).length === 0) {
    if (!this.instance) {
      this.createTooltip(triggerElem, opts);
    }

    // Append this type of tooltip to the page.
    this.appendTooltip(triggerElem, opts.type);
  }

  Tooltip.prototype.appendTooltip = function() {
    const refType = this.refType;
    const triggerElem = this.triggerElem;
    const type = this.type;

    console.log(this.enabled)
    if (this.enabled) {
      clearTimeout(this.timeout);
      this.isVisible = true;
      this.timeout = setTimeout(() => {
        triggerElem.setAttribute('x-tooltip', '');
        this.repositionTooltip(triggerElem, type);
        const container = this.opts.container ? document.querySelector(this.opts.container) : triggerElem;
        container.appendChild(this.instance.popper);
        requestAnimationFrame(() => this.instance.popper.setAttribute('x-in', ''));
      }, this.opts.delay.show);
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

    const tooltip = new Popper(this.triggerElem, template, opts.popper);
    // const typeData = { instance: tooltip, enabled: true, opts  };
    // setType(triggerElem, opts.type, typeData);
    this.instance = tooltip;
    const self = this;
    const resolveURL = new Promise(function(resolve, reject) {
      if (self.opts.url) {
        self.instance.popper.removeAttribute('x-loading-error');
        self.instance.popper.setAttribute('x-loading', '');
        self.opts.content = '<i class="fa fa-spinner fa-spin"></i>';
        self.updateTooltipContent(self.triggerElem, self.type);
        $.ajax({
          url: self.opts.url,
          success: (data) => {
            self.opts.content = data;
          },
          error: (data) => {
            self.instance.popper.setAttribute('x-loading-error', '');
          },
          complete: (data) => {
            self.instance.popper.removeAttribute('x-loading');
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
    const observer = new MutationObserver(this.mutationCallback.bind(this, tooltip, opts.type));
    observer.observe(this.triggerElem, {
      attributes: true,
      attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
    });
  }

  // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
  Tooltip.prototype.mutationCallback = function(tooltip, type, mutations, observer) {
    mutations.forEach((mutation) => {
      this.updateTooltipContent(mutation.target, type);
      observer.takeRecords();
    });
  }
  
  Tooltip.prototype.updateTooltipContent = function() {
    const elem = this.triggerElem;
    const title = this.opts.title || elem.title || elem.dataset.title || elem.dataset.tooltip;
    const content = this.opts.content;

    if (elem.title.length > 0) {
      elem.dataset.title = elem.title;
      elem.removeAttribute('title');
    }

    const popper = this.instance.popper;
    const titleElem = popper.querySelector('[x-title]');
    const contentElem = popper.querySelector('[x-content]');
    if (this.opts.html) {
      titleElem.innerHTML = this.cleanHTML(title) || '';
      contentElem.innerHTML = this.cleanHTML(content) || '';
    } else {
      titleElem.textContent = title || '';
      contentElem.textContent = content || '';
    }
    this.instance.update();
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
    this.instance.update();
  }

  Tooltip.prototype.closeTooltip = function(delayHide) {
    if (this.instance) {
      clearTimeout(this.timeout);
      if (this.isVisible) {
        this.triggerElem.removeAttribute('x-tooltip');
        this.isVisible = false;
        const self = this;
        this.timeout = setTimeout(() => {
          self.instance.popper.addEventListener('transitionend', function fadeOut() {
            self.instance.popper.removeEventListener('transitionend', fadeOut);
            if (self.instance.popper.parentNode) {
              self.instance.popper.parentNode.removeChild(self.instance.popper);
            }
          });
        }, typeof delayHide === 'undefined' ? self.opts.delay.hide : delayHide);
        self.instance.popper.removeAttribute('x-in');
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
        refs.delete(this.triggerElem);
      }
    }
  }

  Tooltip.prototype.getOnOffEvents = function(opts) {
    return this.triggers(opts).reduce((acc, trigger) => {
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

  Tooltip.prototype.triggers = function(opts) {
    return opts.trigger.split(' ').map(x => x.trim());
  }

  Tooltip.prototype.mergeInlineOpts = function(elem, opts = {}) {
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

  Tooltip.prototype.bindEvents = function(context, selector, opts) {
    const events = getOnOffEvents(opts);
    events.forEach((event) => {
      const [ onEvent, offEvent ] = event;
      if (offEvent) {
        $(context).on(onEvent, selector, (e) => {
          opts = mergeInlineOpts(e.currentTarget, opts);
          const ref = getRef(e.currentTarget);
          const instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
          // openTooltip(e.currentTarget, opts);
          instance.openTooltip();
        }).on(offEvent, selector, (e) => {
          const elem = e.currentTarget;
          if (elem.contains(e.relatedTarget)) return;

          opts = mergeInlineOpts(elem, opts);
          const ref = getRef(e.currentTarget);
          const instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
          // const refType = getType(elem, opts.type);
          if (offEvent === 'mouseout' && e.relatedTarget === instance.instance.popper) {
            $(instance.instance.popper).on('mouseleave', function mouseLeaveHandler(e) {
              instance.closeTooltip();
              $(instance.instance.popper).off('mouseleave', mouseLeaveHandler);
            });
          } else {
            instance.closeTooltip();
          }
        });
      } else {
        $(context).on(onEvent, selector, (e) => {
          const ref = getRef(e.currentTarget);
          let handleClickOutside;
          opts = mergeInlineOpts(e.currentTarget, opts);
          let instance;
          if (opts.type === 'tooltip') {
            instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
          } else {
            instance = ref[opts.type] ? ref[opts.type] : new Popover(e.currentTarget, opts);
          }


          let closeOnClick;
          if (instance.isVisible) {
            // $(document).off(onEvent, handleClickOutside);
            instance.closeTooltip();
          } else {
            // debugger
            const elem = e.currentTarget;
            instance.openTooltip();
            const tooltip = instance.instance.popper;
            // requestAnimationFrame(() => {
            //   $(document).on(onEvent, function handleClickOutside(e2) {
            //     // debugger
            //     if (!tooltip.contains(e2.target)) {
            //       $(document).off(onEvent, handleClickOutside);
            //       instance.closeTooltip();
            //     }
            //   })
            // })
          }
        });
      }
    });
  }

  //---------------------------------------

  class Popover extends Tooltip {
    constructor(triggerElem, opts) {
      opts.type = 'popover'
      super(triggerElem, opts);
      // this.type = 'popover';
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

    // // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    // function mutationCallback(tooltip, type, mutations, observer) {
    //   mutations.forEach((mutation) => {
    //     updateTooltipContent(mutation.target, type);
    //     observer.takeRecords();
    //   });
    // }

    // // Escaping dangerous HTML content **SHOULD** be done server-side, however, people occasionally forget to do this.
    // // `cleanHTML` serves as a measure of last resort, removing explicitly dangerous tags, removing any non-whitelisted attributes,
    // // and ensuring that any references to external files point to actual external references (not inline JS).
    // function cleanHTML(str) {
    //   if (!str) return;
    //   const dom = new DOMParser().parseFromString(str, 'text/html');
    //   const body = dom.body;
    //   const elems = dom.body.querySelectorAll('*');

    //   for (const node of elems) {
    //     // Strip any <script>/<iframe> tags as those can open us up to XSS.
    //     if (/^(script|iframe|style)$/i.test(node.nodeName)) {
    //       node.parentNode.removeChild(node);
    //     } else {
    //       for (const attr of node.attributes) {
    //         // Strip any attribute with "javascript:" in the value.
    //         if (/(j|&#106;|&#74;)avascript:/i.test(attr.value)) {
    //           node.removeAttribute(attr.name);
    //         } else if (/href|src|srcset/i.test(attr.name)) {
    //           // Strip any href, src, srcset attribute that does not start with `http://` or `https://`.
    //           if (!/^https?:\/\//i.test(attr.value)) {
    //             node.removeAttribute(attr.name);
    //           }
    //         } else {
    //           // Strip any attributes that are not class, id, title, alt, width, or height.
    //           if (!/class|id|title|alt|width|height/i.test(attr.name)) {
    //             node.removeAttribute(attr.name);
    //           }
    //         }
    //       }
    //     }
    //   }
    //   return body.innerHTML;
    // }

    // function updateTooltipContent(elem, type) {
    //   const refType = getType(elem, type);
    //   const title = refType.opts.title || elem.title || elem.dataset.title || elem.dataset.tooltip;
    //   const content = refType.opts.content;

    //   if (elem.title.length > 0) {
    //     elem.dataset.title = elem.title;
    //     elem.removeAttribute('title');
    //   }

    //   const popper = refType.instance.popper;
    //   const titleElem = popper.querySelector('[x-title]');
    //   const contentElem = popper.querySelector('[x-content]');
    //   if (refType.opts.html) {
    //     titleElem.innerHTML = cleanHTML(title) || '';
    //     contentElem.innerHTML = cleanHTML(content) || '';
    //   } else {
    //     titleElem.textContent = title || '';
    //     contentElem.textContent = content || '';
    //   }
    //   refType.instance.update();
    // }

    // function getTemplate(opts) {
    //   const $template = opts.template
    //     ? $(opts.template)
    //     : $(`<div class="${['aha-tooltip', `aha-tooltip--${opts.type || 'default'}`, opts.class || ''].join(' ').trim()}" role="tooltip">
    //     <div class="aha-tooltip__arrow"></div>
    //     <div class="aha-tooltip__inner">
    //       <div class="aha-tooltip__title" x-title></div>
    //       <div class="aha-tooltip__content" x-content></div>
    //     </div>
    //   </div>`);
    //   return $template[0];
    // }

    // function createTooltip(triggerElem, opts) {
    //   const template = getTemplate(opts);
    //   const type = opts.type;
    //   if (opts.placement) {
    //     opts.popper.placement = opts.placement;
    //   }

    //   const tooltip = new Popper(triggerElem, template, opts.popper);
    //   const typeData = { instance: tooltip, enabled: true, opts  };
    //   setType(triggerElem, opts.type, typeData);
    //   const resolveURL = new Promise(function(resolve, reject) {
    //     if (typeData.opts.url) {
    //       typeData.instance.popper.removeAttribute('x-loading-error');
    //       typeData.instance.popper.setAttribute('x-loading', '');
    //       typeData.opts.content = '<i class="fa fa-spinner fa-spin"></i>';
    //       updateTooltipContent(triggerElem, type);
    //       $.ajax({
    //         url: typeData.opts.url,
    //         success: (data) => {
    //           typeData.opts.content = data;
    //         },
    //         error: (data) => {
    //           typeData.instance.popper.setAttribute('x-loading-error', '');
    //         },
    //         complete: (data) => {
    //           typeData.instance.popper.removeAttribute('x-loading');
    //           resolve();
    //         }
    //       });
    //     } else {
    //       resolve();
    //     }
    //   }).then(() => {
    //     updateTooltipContent(triggerElem, type);
    //   });

    //   // Watch for changes to title, data-title, data-tooltip, data-content and update the tooltip contents accordingly.
    //   // This enables us to change the title/data-title/data-tooltip/data-content of the tooltip triggering element
    //   // and have those changes automatically reflected in the tooltip popup.
    //   const observer = new MutationObserver(mutationCallback.bind(null, tooltip, opts.type));
    //   observer.observe(triggerElem, {
    //     attributes: true,
    //     attributeFilter: ['title', 'data-tooltip', 'data-title', 'data-content'],
    //   });
    // }

    // function repositionTooltip(triggerElem, type) {
    //   const refType = getType(triggerElem, type);
    //   if (refType) {
    //     refType.instance.update();
    //   }
    // }

    // function openTooltip(triggerElem, opts) {
    //   const ref = getRef(triggerElem);
    //   const refType = getType(triggerElem, opts.type);

    //   // Close any other type of tooltip that is open for this triggering element.
    //   Object.keys(ref).forEach((type) => {
    //     if (type !== opts.type) {
    //       closeTooltip(triggerElem, type, 0);
    //     }
    //   })

    //   // If the triggering element does not have this type of tooltip, create it.
    //   if (Object.keys(refType).length === 0) {
    //     createTooltip(triggerElem, opts);
    //   }

    //   // Append this type of tooltip to the page.
    //   appendTooltip(triggerElem, opts.type);
    // }

    // function appendTooltip(triggerElem, type) {
    //   const refType = getType(triggerElem, type);
    //   if (refType && refType.enabled) {
    //     clearTimeout(refType.timeout);
    //     refType.isVisible = true;
    //     refType.timeout = setTimeout(() => {
    //       triggerElem.setAttribute('x-tooltip', '');
    //       repositionTooltip(triggerElem, type);
    //       const container = refType.opts.container ? document.querySelector(refType.opts.container) : triggerElem;
    //       container.appendChild(refType.instance.popper);
    //       requestAnimationFrame(() => refType.instance.popper.setAttribute('x-in', ''));
    //     }, refType.opts.delay.show);
    //   }
    // }

    // function closeTooltip(triggerElem, type, delayHide) {
    //   const refType = getType(triggerElem, type);
    //   if (refType) {
    //     clearTimeout(refType.timeout);
    //     if (refType.isVisible) {
    //       triggerElem.removeAttribute('x-tooltip');
    //       refType.isVisible = false;
    //       refType.timeout = setTimeout(() => {
    //         refType.instance.popper.addEventListener('transitionend', function fadeOut() {
    //           refType.instance.popper.removeEventListener('transitionend', fadeOut);
    //           if (refType.instance.popper.parentNode) {
    //             refType.instance.popper.parentNode.removeChild(refType.instance.popper);
    //           }
    //         });
    //       }, typeof delayHide === 'undefined' ? refType.opts.delay.hide : delayHide);
    //       refType.instance.popper.removeAttribute('x-in');
    //     }
    //   }
    // }

    // function enableTooltip(triggerElem, type) {
    //   const refType = getType(triggerElem, type);
    //   if (refType) {
    //     refType.enabled = true;
    //   }
    // }

    // function disableTooltip(triggerElem, type) {
    //   closeTooltip(triggerElem, type, 0);
    //   const refType = getType(triggerElem, type);
    //   if (refType) {
    //     refType.enabled = false;
    //   }
    // }

    // function destroyTooltip(triggerElem, type) {
    //   closeTooltip(triggerElem, type, 0);
    //   const ref = getRef(triggerElem);
    //   if (ref[type]) {
    //     ref[type].instance.destroy();
    //     delete ref[type];
    //     // If this is the last type of tooltip for the element, delete the WeakMap reference.
    //     if (Object.keys(ref).length === 0) {
    //       refs.delete(triggerElem);
    //     }
    //   }
    // }

    // function getOnOffEvents(opts) {
    //   return triggers(opts).reduce((acc, trigger) => {
    //     if (trigger === 'click') {
    //       acc.push(['click']);
    //     } else if (trigger === 'focus') {
    //       acc.push(['focus', 'blur']);
    //     } else if (trigger === 'hover') {
    //       acc.push(['mouseenter', 'mouseout']);
    //     }
    //     return acc;
    //   }, []);
    // }

    // function triggers(opts) {
    //   return opts.trigger.split(' ').map(x => x.trim());
    // }

    // function mergeInlineOpts(elem, opts = {}) {
    //   Object.keys(Object.assign({}, elem.dataset)).forEach((key) => {
    //     let value = elem.dataset[key];
    //     try {
    //       value = JSON.parse(value.replace(/'/g, '"'));
    //       if (Array.isArray(value) || key === 'delay') {
    //         opts[key] = value;
    //       } else {
    //         if (value[opts.type]) {
    //           opts[key] = value[opts.type];
    //         }
    //       }
    //     } catch {
    //       opts[key] = value;
    //     }
    //   });
    //   return opts;
    // }

    // function bindEvents(context, selector, opts) {
    //   const events = getOnOffEvents(opts);
    //   events.forEach((event) => {
    //     const [ onEvent, offEvent ] = event;
    //     if (offEvent) {
    //       $(context).on(onEvent, selector, (e) => {
    //         opts = mergeInlineOpts(e.currentTarget, opts);
    //         const ref = getRef(e.currentTarget);
    //         const instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
    //         // openTooltip(e.currentTarget, opts);
    //         instance.openTooltip();
    //       }).on(offEvent, selector, (e) => {
    //         const elem = e.currentTarget;
    //         if (elem.contains(e.relatedTarget)) return;

    //         opts = mergeInlineOpts(elem, opts);
    //         const ref = getRef(e.currentTarget);
    //         const instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
    //         // const refType = getType(elem, opts.type);
    //         if (offEvent === 'mouseout' && e.relatedTarget === instance.instance.popper) {
    //           $(instance.instance.popper).on('mouseleave', function mouseLeaveHandler(e) {
    //             instance.closeTooltip();
    //             $(instance.instance.popper).off('mouseleave', mouseLeaveHandler);
    //           });
    //         } else {
    //           instance.closeTooltip();
    //         }
    //       });
    //     } else {
    //       $(context).on(onEvent, selector, (e) => {
    //         const ref = getRef(e.currentTarget);
    //         let handleClickOutside;
    //         opts = mergeInlineOpts(e.currentTarget, opts);
    //         let instance;
    //         if (opts.type === 'tooltip') {
    //           instance = ref[opts.type] ? ref[opts.type] : new Tooltip(e.currentTarget, opts);
    //         } else {
    //           instance = ref[opts.type] ? ref[opts.type] : new Popover(e.currentTarget, opts);
    //         }


    //         let closeOnClick;
    //         if (instance.isVisible) {
    //           // $(document).off(onEvent, handleClickOutside);
    //           instance.closeTooltip();
    //         } else {
    //           // debugger
    //           const elem = e.currentTarget;
    //           instance.openTooltip();
    //           const tooltip = instance.instance.popper;
    //           // requestAnimationFrame(() => {
    //           //   $(document).on(onEvent, function handleClickOutside(e2) {
    //           //     // debugger
    //           //     if (!tooltip.contains(e2.target)) {
    //           //       $(document).off(onEvent, handleClickOutside);
    //           //       instance.closeTooltip();
    //           //     }
    //           //   })
    //           // })
    //         }
    //       });
    //     }
    //   });
    // }

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
