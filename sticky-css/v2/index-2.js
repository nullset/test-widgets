$(document).ready(function() {
  var $table = $('#blah');
  
  $table.find('thead th:nth-child(-n+3)').each((i, th) => {
    $(th).addClass('sticky--is-stuck');
  });
  
  $table.find('thead th:nth-child(n+4)').each((i, th) => {
    $(th).addClass('sticky--is-stuck-y');
  });
  
  
  // [5, 4, 3, 2, 1].forEach((num) => {
  //   $table.find(`tbody tr:nth-child(n+1):nth-child(-n+${num})`).each((i, row) => {
  //     $(row).find(`td:nth-child(-n+${num})`).addClass('sticky sticky-scroll-y');
  //   })  
  // });
  
  
  $table.find(`tbody tr:nth-child(n+1):nth-child(-n+5) *:nth-child(-n+3)`).addClass('sticky--is-stuck-x');
  
  $table.find(`tbody tr:nth-child(6) *:nth-child(-n+2)`).addClass('sticky--is-stuck-x');
  $table.find(`tbody tr:nth-child(7) *:nth-child(-n+1)`).addClass('sticky--is-stuck-x');
  
  
  $table.stickyTable();
  
});
