$(document).ready(function() {

    $(document).ahaTooltip({
      selector: '.btn',
      // trigger: 'click',
      container: 'body',
      // placement: 'left',
      // delay: {
      //   show: 1000,
      //   hide: 1000,
      // }
    })

    $('.btn2').ahaTooltip({
      // trigger: 'hover',
      html: true,
      container: 'body',
      // placement: 'left',
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
      // placement: 'left',
      type: 'popover',
    });

    $('.btn5').ahaTooltip();

    $('.btn6').popover({
      selector: '.btn4',
      trigger: 'click',
      container: 'body',
      html: true,
      // placement: 'right',
      type: 'popover',
      url: 'http://localhost:7879/junk.html'
      // url: 'aoeu'
    });

    $('.btn7').ahaTooltip({
      trigger: 'hover',
      container: 'body',
      html: true,
      // url: 'aoeu'
    }).popover({
      trigger: 'click',
      container: 'body',
      type: 'popover',
    });

});