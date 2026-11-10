/* Chùm ảnh: bấm vào ảnh để xem lớn; mũi tên, phím ← → hoặc vuốt để qua ảnh khác trong cùng chùm.
   Ảnh lớn phóng ra từ đúng chỗ ảnh nhỏ vừa bấm, đóng thì thu về chỗ ảnh nhỏ (máy bật giảm chuyển động thì hiện ngay).
   Không có JavaScript thì mỗi ảnh vẫn là đường dẫn tới ảnh lớn. */
(function () {
  var cacChum = document.querySelectorAll('[data-chum]');
  if (!cacChum.length) return;

  function bieuTuong(duong) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + duong + '"/></svg>';
  }

  var khung = document.createElement('dialog');
  khung.id = 'chum-xem';
  khung.setAttribute('aria-label', 'Xem ảnh');
  khung.innerHTML =
    '<img alt="Phở Vy Nam">' +
    '<p class="chum-dem" aria-live="polite"></p>' +
    '<button type="button" class="chum-truoc" aria-label="Ảnh trước">' + bieuTuong('m15 18-6-6 6-6') + '</button>' +
    '<button type="button" class="chum-sau" aria-label="Ảnh sau">' + bieuTuong('m9 18 6-6-6-6') + '</button>' +
    '<button type="button" class="chum-dong" aria-label="Đóng" autofocus>' + bieuTuong('M18 6 6 18M6 6l12 12') + '</button>';
  document.body.appendChild(khung);

  var anh = khung.querySelector('img');
  var dem = khung.querySelector('.chum-dem');
  var ds = [];
  var vt = 0;
  var goc = document.documentElement;
  var coPhong = !!anh.animate && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var dangAn = null;      // ảnh nhỏ đang tạm ẩn (ảnh lớn đang đứng thay chỗ nó)
  var dangDong = false;
  var NGUYEN = { transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0% 0% 0% 0% round 0px)' };

  // ẩn ảnh nhỏ đang được xem lớn, trả lại ảnh nhỏ đã ẩn trước đó
  function an(a) {
    if (dangAn) dangAn.style.visibility = '';
    dangAn = a;
    if (a) a.style.visibility = 'hidden';
  }

  // chỗ của ảnh nhỏ trên màn hình: khung của cả tấm ảnh (tính cả phần bị cắt khuất) và tỉ lệ bị cắt ở 4 cạnh
  function choAnhNho(a) {
    var nho = a.querySelector('img');
    var o = a.getBoundingClientRect();
    var rong = +nho.getAttribute('width'), cao = +nho.getAttribute('height');
    if (!rong || !cao || !o.width || !o.height) return null;
    if (o.bottom < 0 || o.top > window.innerHeight || o.right < 0 || o.left > window.innerWidth) return null;
    var tl = Math.max(o.width / rong, o.height / cao);
    var w = rong * tl, h = cao * tl;
    var chinh = getComputedStyle(nho).objectPosition.split(' ');
    var px = parseFloat(chinh[0]) / 100, py = parseFloat(chinh[1]) / 100;
    if (isNaN(px)) px = .5;
    if (isNaN(py)) py = .5;
    var x = o.left + (o.width - w) * px, y = o.top + (o.height - h) * py;
    return { x: x, y: y, w: w, cat: [(o.top - y) / h, (x + w - o.right) / w, (y + h - o.bottom) / h, (o.left - x) / w] };
  }

  // khung hình đưa ảnh lớn (đang nằm ở "lon") về đúng chỗ ảnh nhỏ
  function veChoNho(nho, lon) {
    var k = nho.w / lon.width;
    return {
      transform: 'translate(' + (nho.x - lon.left) + 'px, ' + (nho.y - lon.top) + 'px) scale(' + k + ')',
      clipPath: 'inset(' + nho.cat.map(function (c) { return (Math.max(0, c) * 100).toFixed(3) + '%'; }).join(' ') + ' round ' + (10 / k).toFixed(2) + 'px)'
    };
  }

  function hien(i) {
    vt = (i + ds.length) % ds.length;
    var a = ds[vt], nho = a.querySelector('img');
    // báo trước tỉ lệ và bề ngang ảnh cho CSS, để khung ảnh lớn có sẵn kích thước khi ảnh chưa tải xong
    var rong = +nho.getAttribute('width'), cao = +nho.getAttribute('height');
    if (rong && cao) {
      anh.style.setProperty('--tl', (rong / cao).toFixed(5));
      anh.style.setProperty('--rong', rong + 'px');
    } else {
      anh.style.removeProperty('--tl');
      anh.style.removeProperty('--rong');
    }
    // hiện ngay ảnh nhỏ đã tải sẵn, ảnh lớn tải xong thì thay vào
    if (nho.currentSrc && nho.complete && nho.naturalWidth) {
      anh.src = nho.currentSrc;
      var lon = new Image();
      lon.onload = function () { if (khung.open && ds[vt] === a) anh.src = a.href; };
      lon.src = a.href;
    } else {
      anh.src = a.href;
    }
    if (coPhong && khung.open) an(a);
    dem.textContent = (vt + 1) + ' / ' + ds.length;
    // tải sẵn 2 ảnh kề bên cho lúc chuyển ảnh khỏi chờ
    [vt + 1, vt - 1].forEach(function (k) {
      new Image().src = ds[(k + ds.length) % ds.length].href;
    });
  }

  cacChum.forEach(function (chum) {
    var cacAnh = Array.prototype.slice.call(chum.querySelectorAll('.xem-anh'));
    cacAnh.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        ds = cacAnh;
        hien(i);
        goc.classList.add('chum-mo');
        khung.showModal();
        if (!coPhong) return;
        // ảnh lớn phóng ra từ chỗ ảnh nhỏ
        var nho = choAnhNho(a), lon = anh.getBoundingClientRect();
        if (!nho || !lon.width) return;
        an(a);
        anh.animate([veChoNho(nho, lon), NGUYEN], { duration: 380, easing: 'cubic-bezier(.2, .7, .2, 1)' });
      });
    });
  });

  khung.querySelector('.chum-truoc').addEventListener('click', function () { hien(vt - 1); });
  khung.querySelector('.chum-sau').addEventListener('click', function () { hien(vt + 1); });
  khung.querySelector('.chum-dong').addEventListener('click', dong);

  // đóng: ảnh lớn thu về chỗ ảnh nhỏ (nếu ảnh nhỏ đang nằm trong màn hình và không đang phóng to bằng 2 ngón)
  function dong() {
    if (dangDong) return;
    var dangPhong = window.visualViewport && window.visualViewport.scale > 1.01;
    var nho = coPhong && !dangPhong ? choAnhNho(ds[vt]) : null;
    var lon = anh.getBoundingClientRect();
    if (!nho || !lon.width) { khung.close(); return; }
    dangDong = true;
    khung.classList.add('chum-thu');
    var hd = anh.animate([NGUYEN, veChoNho(nho, lon)], { duration: 300, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
    var xong = function () {
      if (!dangDong) return;
      dangDong = false;
      khung.close();
      hd.cancel();
    };
    hd.onfinish = hd.oncancel = xong;
  }

  // bấm vào vùng nền tối ngoài ảnh là đóng
  khung.addEventListener('click', function (e) {
    if (e.target === khung) dong();
  });
  // phím Esc
  khung.addEventListener('cancel', function (e) {
    if (!coPhong) return;
    e.preventDefault();
    dong();
  });
  khung.addEventListener('close', function () {
    dangDong = false;
    an(null);
    khung.classList.remove('chum-thu');
    goc.classList.remove('chum-mo');
    anh.removeAttribute('src');
  });
  khung.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') hien(vt - 1);
    if (e.key === 'ArrowRight') hien(vt + 1);
  });

  // vuốt ngang để qua ảnh; 2 ngón là đang phóng to nên bỏ qua
  var x0 = null, y0 = 0;
  khung.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }
    else x0 = null;
  }, { passive: true });
  khung.addEventListener('touchend', function (e) {
    if (x0 === null || (window.visualViewport && window.visualViewport.scale > 1.01)) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) hien(vt + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
