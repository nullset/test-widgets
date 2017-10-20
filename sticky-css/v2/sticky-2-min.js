"use strict";!function($){$.fn.stickyTable=function(t){function s(t,s){var e=$('<div class="sticky-table-wrapper">');return e.css({maxWidth:s.maxWidth,maxHeight:s.maxHeight,overflowX:"none"===s.maxWidth?"hidden":"auto",overflowY:"none"===s.maxHeight?"hidden":"auto"}),t.wrap(e),t.parent()}function e(t,s,e,l){var i=t.originalEvent,o=i.deltaX,a=i.deltaY,r=s.scrollWidth,n=s.scrollHeight,u=s.clientWidth,f=s.clientHeight,d=r-u,h=n-f,p=parseInt(s.getAttribute("data-scroll-left"),10),y=parseInt(s.getAttribute("data-scroll-top"),10),b=p+o,k=y+a;b>=d&&(b=d),b<=0&&(b=0),k>=h&&(k=h),k<=0&&(k=0),b>0||k>0?s.classList.add("sticky--is-scrolling"):s.classList.remove("sticky--is-scrolling"),s.setAttribute("data-scroll-left",b),s.setAttribute("data-scroll-top",k),s.scrollLeft=b,s.scrollTop=k,c(l,b,k)}function l(t,s){requestAnimationFrame(function(){i(t,s)})}function i(t,s){t.setAttribute("data-scroll-left",t.scrollLeft),t.setAttribute("data-scroll-top",t.scrollTop),c(s,t.scrollLeft,t.scrollTop)}function o(t){var s=t/10,e=6,l=2;return s>6?6:s<2?2:s}function c(t){var s=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;t.forEach(function(t,l){var i=o(s),c=o(e),a=[];t.style.boxShadow=i+"px "+c+"px "+i+"px rgba(0,0,0,0.15), "+i+"px "+c+"px "+c+"px  rgba(0,0,0,0.15)",t.classList.contains("sticky--is-stuck-y")&&!t.classList.contains("sticky--is-stuck")||a.push("translateX("+s+"px)"),t.classList.contains("sticky--is-stuck-x")&&!t.classList.contains("sticky--is-stuck")||a.push("translateY("+e+"px)"),t.style.transform=a.join(" ")})}var a=this;return this.each(function(){var t=a,i=t[0],o=window.getComputedStyle(i),r=s(t,o),n=r[0],u=i.querySelectorAll('th[class*="sticky--is-stuck"], td[class*="sticky--is-stuck"]'),f=!1;return n.setAttribute("data-scroll-left",0),n.setAttribute("data-scroll-top",0),c(u),u.forEach(function(t){cellStyles=window.getComputedStyle(t),["Top","Right","Bottom","Left"].forEach(function(s){["Width"].forEach(function(e){t.style.setProperty("--border-"+s.toLowerCase()+"-"+e.toLowerCase(),cellStyles["border"+s+e])})})}),r.off("wheel.stickyTable mousewheel.stickyTable",e).on("wheel.stickyTable mousewheel.stickyTable",function(t){f=!0,t.preventDefault(),e(t,n,r,u)}),r.off("scroll.stickyTable",l).on("scroll.stickyTable",function(){f?f=!1:l(n,u)}),{$table:t,$wrapper:r}}),this}}(jQuery);