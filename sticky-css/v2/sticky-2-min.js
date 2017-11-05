"use strict";!function($){$.fn.stickyTable=function(t){function s(t,s){var e=$('<div class="sticky-table-wrapper">');return e.css({maxWidth:s.maxWidth,maxHeight:s.maxHeight,overflowX:"none"===s.maxWidth?"hidden":"auto",overflowY:"none"===s.maxHeight?"hidden":"auto"}),t.wrap(e),t.parent()}function e(t,s,e,i){var o=t.originalEvent,l=o.deltaX,r=o.deltaY,c=s.scrollWidth,n=s.scrollHeight,u=s.clientWidth,f=s.clientHeight,d=c-u,h=n-f,p=parseInt(s.getAttribute("data-scroll-left"),10),y=parseInt(s.getAttribute("data-scroll-top"),10),b=p+l,k=y+r;b>=d&&(b=d),b<=0&&(b=0),k>=h&&(k=h),k<=0&&(k=0),b>0||k>0?s.classList.add("sticky--is-scrolling"):s.classList.remove("sticky--is-scrolling"),s.setAttribute("data-scroll-left",b),s.setAttribute("data-scroll-top",k),a(i,b,k),s.scrollLeft=b,s.scrollTop=k}function i(t,s){requestAnimationFrame(function(){o(t,s)})}function o(t,s){t.setAttribute("data-scroll-left",t.scrollLeft),t.setAttribute("data-scroll-top",t.scrollTop),a(s,t.scrollLeft,t.scrollTop)}function l(t){var s=t/10,e=6,i=2;return s>6?6:s<2?2:s}function a(t){var s=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;t.forEach(function(t){var i=l(s),o=l(e),a=[];t.style.boxShadow=i+"px "+o+"px "+i+"px rgba(0,0,0,0.15), "+i+"px "+o+"px "+o+"px  rgba(0,0,0,0.15)",t.classList.contains("sticky--is-stuck-y")&&!t.classList.contains("sticky--is-stuck")||a.push("translateX("+s+"px)"),t.classList.contains("sticky--is-stuck-x")&&!t.classList.contains("sticky--is-stuck")||a.push("translateY("+e+"px)"),t.style.transform=a.join(" ")})}var r=this;return this.each(function(){var t=r,o=t[0],l=window.getComputedStyle(o);window.tableStyles=l;var c=s(t,l),n=c[0],u=t.find('th[class*="sticky--is-stuck"], td[class*="sticky--is-stuck"]').toArray();console.log("stickyElems",u);var f=!1;return n.setAttribute("data-scroll-left",0),n.setAttribute("data-scroll-top",0),a(u),u.forEach(function(t){var s=window.getComputedStyle(t);["Top","Right","Bottom","Left"].forEach(function(e){["Width"].forEach(function(i){t.style.setProperty("--border-"+e.toLowerCase()+"-"+i.toLowerCase(),s["border"+e+i])})})}),c.off("wheel.stickyTable mousewheel.stickyTable",e).on("wheel.stickyTable mousewheel.stickyTable",function(t){f=!0,t.preventDefault(),e(t,n,c,u)}),c.off("scroll.stickyTable",i).on("scroll.stickyTable",function(){f?f=!1:i(n,u)}),{$table:t,$wrapper:c}}),this}}(jQuery);