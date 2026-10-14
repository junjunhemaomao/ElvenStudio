/* ==========================================================================
   ELVEN STUDIO — 全站脚本
   --------------------------------------------------------------------------
   无依赖，只做两件事：

     1. 手机上的汉堡菜单（宽于 960px 时 CSS 会强制展开，这里不管）
     2. 作品灯箱：63x63 的缩略图点开能看大一点，能翻页、能键盘操作

   上一版那 60 行是给"定宽舞台 + transform: scale"用的，整站不再缩放，
   那段同时作废了。
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     汉堡菜单
     ---------------------------------------------------------------------- */
  var toggle = document.querySelector(".hdr-toggle");
  var nav = document.querySelector(".hdr-nav");

  if (toggle && nav) {
    var setNav = function (open) {
      nav.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };

    // 桌面尺寸下 nav 必须是展开的；窄屏进来时先收起
    var syncNav = function () {
      if (window.innerWidth > 960) {
        nav.hidden = false;
        toggle.setAttribute("aria-expanded", "false");
      } else if (toggle.getAttribute("aria-expanded") !== "true") {
        nav.hidden = true;
      }
    };
    syncNav();

    toggle.addEventListener("click", function () {
      setNav(nav.hidden);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !nav.hidden && window.innerWidth <= 960) {
        setNav(false);
        toggle.focus();
      }
    });

    // 点菜单外面收起来
    document.addEventListener("click", function (e) {
      if (nav.hidden || window.innerWidth > 960) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setNav(false);
    });

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(syncNav, 150);
    });
  }

  /* ----------------------------------------------------------------------
     灯箱
     触发元素是 <button class="tile" data-full="大图路径" data-group="组名">。
     data-full 为空（或没有这个属性）的格子不参与，点了不弹——
     画册页那些占位图就是这样排除掉的。
     ---------------------------------------------------------------------- */
  var box = document.querySelector(".lightbox");
  if (!box) return;

  var boxImg = box.querySelector(".lb-img");
  var boxCap = box.querySelector(".lb-cap");
  var btnPrev = box.querySelector(".lb-prev");
  var btnNext = box.querySelector(".lb-next");
  var btnClose = box.querySelector(".lb-close");

  // items 就是所有 data-full 非空的元素的清单，顺序即文档顺序。
  // 顺手把下标写回元素上，点击时 O(1) 就能定位。
  var items = [];
  var current = -1;
  var lastFocus = null;

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-full]"),
    function (el) {
      var src = el.getAttribute("data-full");
      if (!src) return;
      var img = el.querySelector("img");
      el.lightboxIndex = items.length;
      items.push({
        src: src,
        cap: el.getAttribute("data-caption") || (img ? img.alt : ""),
        // 源图和缩略图不是同一个文件，说明是小图放大看的
        thumb: !!img && img.getAttribute("src") !== src
      });
    }
  );

  if (!items.length) return;

  function show(i) {
    if (i < 0 || i >= items.length) return;
    current = i;
    var it = items[i];
    boxImg.src = it.src;
    boxImg.alt = it.cap || "";
    boxImg.classList.toggle("is-thumb", !!it.thumb);
    boxCap.textContent = it.cap || "";
    var many = items.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
  }

  function open(i, from) {
    lastFocus = from || document.activeElement;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    show(i);
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    boxImg.removeAttribute("src");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(d) {
    if (!items.length) return;
    show((current + d + items.length) % items.length);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-full]") : null;
    if (!el || typeof el.lightboxIndex !== "number") return;
    e.preventDefault();
    open(el.lightboxIndex, el);
  });

  btnPrev.addEventListener("click", function () { step(-1); });
  btnNext.addEventListener("click", function () { step(1); });
  btnClose.addEventListener("click", function () { close(); });

  // 点底衬关闭，点图片本身不关
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); return; }
    if (e.key === "Tab") {
      // 焦点圈在灯箱里：只有三个按钮，转一圈
      var f = [btnPrev, btnNext, btnClose].filter(function (b) { return !b.hidden; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
