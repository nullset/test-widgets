$(document).ready(function() {

    $(document).ahaTooltip({
      selector: '.btn',
      trigger: 'click',
      container: 'body',
      placement: 'bottom',
      delay: {
        show: 1000,
        hide: 1000,
      }
    })

    $('.btn2').ahaTooltip({
      trigger: 'click',
      html: true,
      // container: 'body',
      placement: 'bottom',
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
      placement: 'bottom',
      type: 'popover',
    });

    $('.btn5').ahaTooltip();

    $('.btn6').ahaTooltip({
      selector: '.btn4',
      trigger: 'click',
      container: 'body',
      html: true,
      placement: 'bottom',
      type: 'popover',
      url: 'http://localhost:7879/junk.html'
      // url: 'aoeu'
    });

});