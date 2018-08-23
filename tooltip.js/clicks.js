$(document).ready(function() {

    $(document).ahaTooltip({
      selector: '.btn',
      trigger: 'click',
      container: 'body',
      placement: 'top',
      delay: {
        show: 1000,
        hide: 1000,
      }
    })

    $('.btn2').ahaTooltip({
      trigger: 'hover',
      html: true,
      // container: 'body',
      placement: 'top',
      // delay: {
      //   show: 1000,
      //   hide: 1000,
      // }
    })

    $('.btn3').ahaTooltip({
      trigger: 'click',
      html: true,
      container: 'body',
    })

    $(document).ahaTooltip({
      selector: '.btn4',
      trigger: 'click',
      container: 'body',
      html: true,
      placement: 'top',
      type: 'popover',
    });

    $('.btn5').ahaTooltip();

});