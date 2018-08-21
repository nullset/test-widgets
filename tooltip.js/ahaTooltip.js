(function($) {
  const fnName = 'ahaTooltip';
  const disabledName = `${fnName}Disabled`
  $.fn[fnName] = function(opts = {}) {

    // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
    function mutationCallback(tooltip, mutations, observer) {
      mutations.forEach((mutation) => {
        const value = mutation.target.getAttribute(mutation.attributeName);
        tooltip.updateTitleContent(value);
        if (mutation.attributeName === 'title') {
          mutation.target.dataset.title = mutation.target.title;
          mutation.target.removeAttribute('title');
          observer.takeRecords();
        }
      });
    }

    function mergeData($elem, newData = {}) {
      const oldData = $elem.data(fnName) || {};
      const mergedData = Object.assign(oldData, newData);
      $elem.data(fnName, mergedData);
    }

    if (typeof opts === 'string') {
      switch (opts) {
        case 'show':
          this.each((i, elem) => {
            if (!elem.dataset[disabledName]) {
              const tooltip = $(elem).data(fnName);
              if (tooltip) tooltip.show();
            }
          });
          break;
        case 'hide':
          this.each((i, elem) => {
            const tooltip = $(elem).data(fnName);
            if (tooltip) tooltip.hide();
          });
          break;
        case 'enable':
          this.each((i, elem) => {
            delete elem.dataset[disabledName];
            const $elem = $(elem);
            const tooltip = $elem.data(fnName);
            if (tooltip) {
              tooltip._disabledEvents.forEach(function (_ref) {
                const func = _ref.func;
                const event = _ref.event;
                tooltip.reference.addEventListener(event, func);
              });

              // Move disabled events back to regular events.
              tooltip._events = tooltip._disabledEvents.slice();

              // Remove disabled events as they are no longer needed.
              delete tooltip._disabledEvents;
            }
          });
          break;
        case 'disable':
          this.each((i, elem) => {
            elem.dataset[disabledName] = true;
            const $elem = $(elem);
            const tooltip = $elem.data(fnName);
            if (tooltip) {
              tooltip.hide();

              // Just calling `.hide()` leaves `_isOpening` set to true if tooltip was already shown.
              // Must set it to `false`, otherwise once re-enabled must trigger the open event twice
              // before the tooltip will reappear.
              tooltip._isOpening = false;

              // Store existing events for use when re-enabling.
              tooltip._disabledEvents = tooltip._events.slice();

              tooltip._events.forEach(function (_ref) {
                const func = _ref.func;
                const event = _ref.event;
                tooltip.reference.removeEventListener(event, func);
              });
              tooltip._events = [];
            }
          });
          break;
        default:
          return;
      }
    } else {
      // Default values when undefined
      opts.trigger = opts.trigger || 'hover';
      opts.placement = opts.placement || 'auto';

      // Set context and selector for event assignment.
      let context, selector;
      if (this.selector) {
        context = this.selector;
      } else {
        context = document;
        selector = opts.selector;
      }

      const html = document.querySelector('html');

      // Set original DOM event(s) that trigger Tooltip initialization.
      const domEvent = opts.trigger.replace(/hover/g, 'mouseenter').replace(/\s/g, ', ');

      $(context).on(domEvent, selector, (e) => {
        const $target = $(e.currentTarget);

        // If the triggering element has a "title" attribute, move that content to the "dataset.title"
        // and remove the original "title" attribute. This prevents the native browser title from
        // displaying when the user hovers over the triggering element.
        if (e.currentTarget.title.length > 0) {
          e.currentTarget.dataset.title = e.currentTarget.title;
          e.currentTarget.removeAttribute('title');
        }

        // First time element is activated, establish a Tooltip event handler that is used on all subsequent events.
        // !e.currentTarget.dataset[`disable${fnNameCaps}`] &&
        if (!e.currentTarget.dataset[disabledName] && typeof $target.data(fnName) === 'undefined') {
          opts = Object.assign(opts, {
            title: () => {
              return e.currentTarget.dataset.title || e.currentTarget.dataset.tooltip;
            },
            closeOnClickOutside: true,
            popperOptions: {
              onCreate(instance) {
                // document.querySelector('html').dataset.tooltip = true;
                // document.querySelector('html').setAttribute('data-tooltip', '');
              },
              onUpdate(instance) {
              },
              preventOverflow: {
                boundariesElement: 'window'
              }
            }
          });

          // Instantiate new tooltip.
          const tooltip = new Tooltip(e.currentTarget, opts);

          // Save tooltip instance to target's `.data` for easy accessibility if we need it for
          // use with other scripts.
          $target.data(fnName, tooltip);

          // Show the tooltip.
          $target.trigger(opts.trigger);

          // Watch for changes to title, data-title, data-tooltip, and update the tooltip contents accordingly.
          // This enables us to change the title/data-title/data-tooltip of the tooltip triggering element
          // and have those changes automatically reflected in the tooltip popup.
          var observer = new MutationObserver(mutationCallback.bind(null, tooltip));
          observer.observe(e.currentTarget, {
            attributes: true,
            attributeFilter: ["title", "data-tooltip", "data-title"],
          });
        }
      });
    }

    return this;
  };
}(jQuery));
