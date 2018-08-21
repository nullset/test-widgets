(function($) {
  const selectors = new Map();

  function mutationCallback(tooltip, mutations, observer) {
    mutations.forEach((mutation) => {
      tooltip.updateTitleContent(mutation.target.getAttribute(mutation.attributeName));
      if (mutation.attributeName === 'title') {
        mutation.target.dataset.title = mutation.target.title;
        mutation.target.removeAttribute('title');
        observer.takeRecords();
      }
    });
    // debugger
    // const elem = tooltip.reference;
    // elem.dataset.tooltip = elem.title;
    // elem.removeAttribute('title');
    // observer.takeRecords();
    // tooltip.updateTitleContent(elem.dataset.tooltip);
  }

  $.fn.ahaTooltip = function(opts = {}) {
    const fn = $.fn.ahaTooltip;
    const fnName = 'ahaTooltip';

    let context, selector;
    if (this.selector) {
      context = this.selector;
    } else {
      context = document;
      selector = opts.selector;
    }

    if (typeof opts === 'string') {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            debugger
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            debugger
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            debugger
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            debugger
          });
          break;
        default:
          return;
      }
    } else {
      opts.trigger = opts.trigger || 'hover';
      const domEvent = opts.trigger.replace(/hover/g, 'mouseenter').replace(/\s/g, ', ');
      const optsTitle = opts.title;

      $(context).on(domEvent, selector, (e) => {
        const $target = $(e.currentTarget);
        // const originalTitle = e.currentTarget.title;
        if (e.currentTarget.title.length > 0) {
          e.currentTarget.dataset.tooltip = e.currentTarget.title;
          e.currentTarget.removeAttribute('title');
        }
        // First time element is activated, establish a tooltip event handler
        // that is used on all subsequent events.
        if (typeof $target.data(fnName) === 'undefined') {
          // TODO: mutation observer; when title is set, remove and put on dataset.title
          opts = Object.assign(opts, {
            trigger: opts.trigger,
            placement: 'auto',
            title: () => {
              return e.currentTarget.dataset.tooltip || e.currentTarget.dataset.title;
            },
            popperOptions: {
              onCreate(instance) {},
              onUpdate(instance) {
              },
            }
          });
          const tooltip = new Tooltip(e.currentTarget, opts);
          window.tooltip = tooltip;
          $target.data(fnName, tooltip);
          $target.trigger(opts.trigger);

          var observer = new MutationObserver(mutationCallback.bind(null, tooltip));
          observer.observe(e.currentTarget, {
            attributes: true,
            attributeFilter: ["title", "data-tooltip", "data-title"],
          });

        }
      });

      // const { trigger = 'hover' } = opts;
      // const [ onEvent, offEvent ] = (function(trigger) {
      //   switch (trigger) {
      //     case 'click':
      //       return ['click'];
      //     case 'focus':
      //       return ['focus', 'blur'];
      //     case 'hover':
      //     default:
      //       return ['mouseenter', 'mouseleave'];
      //   }
      // })(trigger);

      // if (offEvent) {
      //   $(context).on(onEvent, selector, (e) => {
      //     debugger
      //     // open({ triggerElem: e.currentTarget, opts });
      //   }).on(offEvent, (e) => {
      //     debugger
      //     // close({ triggerElem: e.currentTarget, opts });
      //   });
      // } else {
      //   $(context).on(onEvent, selector, (e) => {
      //     const $target = $(e.currentTarget);
      //     // First time element is activated, establish a tooltip event handler
      //     // that is used on all subsequent events.
      //     if (typeof $target.ahaTooltip.instance === 'undefined') {
      //       opts = Object.assign(opts, { trigger: onEvent });
      //       $target.ahaTooltip.instance = new Tooltip(e.currentTarget, {
      //         placement: 'right', // or bottom, left, right, and variations
      //         title: "Super",
      //         trigger: onEvent,
      //       });
      //       $target.trigger(onEvent);
      //     }
      //   });
      // }
    }

    $(document).on('scroll, wheel', (e) => {
      // debugger
      // if (fn.openTooltips > 0) {
      //   const $tooltips = $(`.${fnName}__popup`);
      //   $tooltips.each((i, tooltip) => {
      //     const $triggerElem = $(tooltip).data(fnName).$triggerElem;
      //     close({ triggerElem: $triggerElem[0], delayHide: 0 });
      //   });
      // }
    });

    return this;
  };
}(jQuery));
