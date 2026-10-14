/* ==========================================================================
   ELVEN STUDIO — 版面缩放
   --------------------------------------------------------------------------
   老版面是按 1024x768 排的定宽像素图（最宽的一页 696px，最高的约 1050px）。
   大屏上留一堆黑边、小窗口里又要横向滚动，所以这里统一处理：

     · 视口宽度 < 820px —— 不动，交给 CSS 走文档流（手机/平板排版）
     · 装不下宽度     —— 缩到刚好放下，不出现横向滚动条
     · 放得下        —— 按视口高度放大铺满，但夹在 1x ~ 2x 之间（放太大图会糊）

   做法是量出 .stage 的原始尺寸，给它 transform: scale()，同时把 .fit-inner 的
   布局尺寸设成缩放后的尺寸 —— transform 不改变布局盒子，不这么做页面高度和垂直
   居中都会算错。
   ========================================================================== */
(function () {
  "use strict";

  var MIN_WIDTH = 820;   // 与 site.css 里那个 media query 的断点保持一致
  var MAX_SCALE = 2;     // 放大的上限，再大 PNG 就明显发虚了
  var EDGE = 8;          // 缩小时左右各留一点缝，免得贴着滚动条

  var root = document.documentElement;
  var fit = document.querySelector(".fit");
  var stage = fit && fit.querySelector(".stage");
  var inner = fit && fit.querySelector(".fit-inner");

  if (!fit || !stage || !inner) return;

  function fluid() {
    root.classList.remove("is-scaled");
    root.style.removeProperty("--s");
    root.style.removeProperty("--sw");
    root.style.removeProperty("--sh");
  }

  function apply() {
    if (window.innerWidth < MIN_WIDTH) { fluid(); return; }

    // offsetWidth/offsetHeight 不受 transform 影响，缩放状态下量到的仍是原始尺寸
    var w = stage.offsetWidth;
    var h = stage.offsetHeight;
    if (!w || !h) return;

    var s;
    if (w > window.innerWidth - EDGE) {
      s = (window.innerWidth - EDGE) / w;
    } else {
      s = Math.min(MAX_SCALE, Math.max(1, window.innerHeight / h));
    }

    root.classList.add("is-scaled");
    root.style.setProperty("--s", s);
    root.style.setProperty("--sw", (w * s) + "px");
    root.style.setProperty("--sh", (h * s) + "px");
  }

  var timer = null;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  }

  // 图片有固有尺寸，但字体加载完高度可能微变，所以 load 之后再量一次
  apply();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.addEventListener("load", apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
})();
