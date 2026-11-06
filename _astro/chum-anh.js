/* Chùm ảnh: bấm vào ảnh để xem lớn; mũi tên, phím ← → hoặc vuốt để qua ảnh khác trong cùng chùm.
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

  function hien(i) {
    vt = (i + ds.length) % ds.length;
    anh.src = ds[vt].href;
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
        document.documentElement.classList.add('chum-mo');
        khung.showModal();
      });
    });
  });

  khung.querySelector('.chum-truoc').addEventListener('click', function () { hien(vt - 1); });
  khung.querySelector('.chum-sau').addEventListener('click', function () { hien(vt + 1); });
  khung.querySelector('.chum-dong').addEventListener('click', function () { khung.close(); });

  // bấm vào vùng nền tối ngoài ảnh là đóng
  khung.addEventListener('click', function (e) {
    if (e.target === khung) khung.close();
  });
  khung.addEventListener('close', function () {
    document.documentElement.classList.remove('chum-mo');
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
