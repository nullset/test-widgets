$(document).ready(function() {

    // $(document).tooltip({
    //   selector: '.btn',
    //   // trigger: 'click',
    //   container: 'body',
    //   // placement: 'left',
    //   // delay: {
    //   //   show: 1000,
    //   //   hide: 1000,
    //   // }
    // })

    $('.btn2').tooltip({
      html: true,
      container: 'body',
      trigger: 'click',

      // placement: 'left',
      // delay: {
      //   show: 1000,
      //   hide: 1000,
      // }
    })

    // $('.btn3').tooltip({
    //   // trigger: 'click',
    //   html: true,
    //   container: 'body',
    // })

    // $(document).tooltip({
    //   selector: '.btn4',
    //   trigger: 'click',
    //   container: 'body',
    //   html: true,
    //   // placement: 'left',
    //   // type: 'popover',
    // });

    // $('.btn5').popover({
    //   trigger: 'manual',
    // });

    // $('.btn6').popover({
    //   selector: '.btn4',
    //   trigger: 'click',
    //   container: 'body',
    //   html: true,
    //   // placement: 'right',
    //   // type: 'popover',
    //   url: 'http://localhost:7879/junk.html'
    //   // url: 'aoeu'
    // });

    // $('.btn7').tooltip({
    //   trigger: 'hover',
    //   container: 'body',
    //   html: true,
    //   // url: 'aoeu'
    // }).popover({
    //   trigger: 'click',
    //   container: 'body',
    //   // type: 'popover',
    // });

});