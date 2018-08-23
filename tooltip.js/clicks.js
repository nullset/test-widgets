$(document).ready(function() {

    $(document).ahaTooltip({
      selector: '.btn',
      trigger: 'click',
      container: 'body',
      placement: 'top',
    })

    $('.btn2').ahaTooltip({
      trigger: 'hover',
      html: true,
      // container: 'body',
      placement: 'top'
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
    })

});