"use strict";!function($){$.fn.stickyTable=function(t){function l(t,l,e){var o,a,i;t.css({transform:"translate("+l+"px, "+e+"px)"})}function e(t,e,o,a,i){var s=t.data("scroll-x"),c=t.data("scroll-y"),n=t.data("max-x"),r=t.data("max-y"),d=s+a,h=c+i;console.log("newY",h),d<0?d=0:d>n&&(d=n),h<0?h=0:h>r&&(console.log("------- Y"),h=r),t.data({"scroll-x":d,"scroll-y":h}),t.scrollLeft(d),t.scrollTop(h),l(o,d,h)}return this.each(function(){function t(t){var l=$(t);if(0===l.find(".sticky-table-header").length){var e=$('<div class="sticky-table-header"></div>'),o=$('<div class="sticky-table-positioned"></div>');[e,o].forEach(function(l){l.css({background:window.getComputedStyle(t).backgroundColor})});var a=l.html();0===a.length&&(a="&nbsp;",l.html(a)),l.append(e.html(o.html(a)))}}function o(t,l,o){(l.height()>t.height()||l.width()>t.width())&&(t.scrollTop()>0&&l.height()>t.scrollTop()+t.height()||0===t.scrollTop()&&o.originalEvent.deltaY>0||t.scrollLeft()>0&&l.width()>t.scrollLeft()+t.width()||0===t.scrollLeft()&&o.originalEvent.deltaX>0)&&(console.log(t.scrollTop()+t.height(),l.height()),o.preventDefault(),e(t,l,s,o.originalEvent.deltaX,o.originalEvent.deltaY))}function a(t,e){e.data({"scroll-x":e.scrollLeft(),"scroll-y":e.scrollTop()}),l(t,e.scrollTop())}var i=$(this);if(0===i.find("thead").length||0===i.find("tbody").length)return void console.error(i,"must be called on a <div> that includes a table with both a <thead> and a <tbody> element.");i.addClass("sticky-table-wrapper"),void 0===i.data("scroll-x")&&i.data("scroll-x",0),void 0===i.data("scroll-y")&&i.data("scroll-y",0),i.find(".sticky").each(function(){t(this)});var s=i.find(".sticky .sticky-table-positioned"),c=i.find("table");i.data("max-x",c.width()-i.width()),i.data("max-y",c.height()-i.height()),i.off("wheel.stickyTable mousewheel.stickyTable",o).on("wheel.stickyTable mousewheel.stickyTable",function(t){o(i,c,t)}),i.off("scroll.stickyTable",a).on("scroll.stickyTable",function(t){c.height()>i.height()&&a(s,i)}),i.scrollTop()>0&&a(s,i)}),this}}(jQuery);