"use strict";$(document).ready(function(){var t=$("#blah");t.find("thead th:nth-child(-n+3)").each(function(t,d){$(d).addClass("sticky--is-stuck")}),t.find("thead th:nth-child(n+4)").each(function(t,d){$(d).addClass("sticky--is-stuck-y")}),t.find("tbody tr:nth-child(n+1):nth-child(-n+5) *:nth-child(-n+3)").addClass("sticky--is-stuck-x"),t.find("tbody tr:nth-child(6) *:nth-child(-n+2)").addClass("sticky--is-stuck-x"),t.find("tbody tr:nth-child(7) *:nth-child(-n+1)").addClass("sticky--is-stuck-x"),t.stickyTable()});