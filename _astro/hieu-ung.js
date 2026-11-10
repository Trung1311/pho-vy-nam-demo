/* Hiệu ứng chung cho mọi trang (đi cùng hieu-ung.css):
   - trang con: các khối hiện dần khi lướt tới;
   - Về chúng tôi: dòng thời gian tự vẽ theo tay lướt, số của thẻ nào sáng lên khi đường kẻ chạy tới.
   Máy bật giảm chuyển động thì không làm gì. */
(function () {
  if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;

  /* ----- các khối hiện dần ----- */
  var cacKhoi = [].slice.call(document.querySelectorAll(
    '.khoi-tieu, .khung, ol.chu-deu.grid > li, .dong-thoi-gian > li, main article.card'
  ));
  // khối đang thấy sẵn (hoặc đã lướt qua) thì để yên cho khỏi chớp, chỉ ẩn khối còn nằm dưới màn hình
  var daySan = window.innerHeight * .92;
  cacKhoi = cacKhoi.filter(function (k) { return k.getBoundingClientRect().top > daySan; });
  if (cacKhoi.length) {
    var io = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var k = e.target;
        k.style.setProperty('--tre', (n++ * 90) + 'ms');
        k.classList.remove('hd-cho');
        io.unobserve(k);
        // hiện xong thì gỡ hẳn, trả lại hiệu ứng riêng của khối (nếu có)
        setTimeout(function () { k.classList.remove('hd'); k.style.removeProperty('--tre'); }, 1500);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .1 });
    cacKhoi.forEach(function (k) { k.classList.add('hd', 'hd-cho'); io.observe(k); });
  }

  /* ----- dòng thời gian tự vẽ ----- */
  var dong = document.querySelector('.dong-thoi-gian.ve-san');
  if (dong) {
    var cacThe = [].slice.call(dong.children).filter(function (c) { return c.tagName === 'LI'; });
    var daVe = 0, dangCho = false;
    var ve = function () {
      dangCho = false;
      // mốc: đường kẻ chạy tới 62% chiều cao màn hình; chỉ vẽ thêm, không xóa khi lướt ngược lên
      var moc = window.innerHeight * .62;
      var r = dong.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (moc - r.top) / r.height));
      if (p > daVe) { daVe = p; dong.style.setProperty('--ve', p.toFixed(4)); }
      var conLai = false;
      cacThe.forEach(function (li) {
        if (li.classList.contains('sang')) return;
        var so = li.firstElementChild.getBoundingClientRect();
        if (so.top + so.height / 2 <= moc) li.classList.add('sang'); else conLai = true;
      });
      if (daVe >= 1 && !conLai) {
        removeEventListener('scroll', hoi);
        removeEventListener('resize', hoi);
      }
    };
    var hoi = function () { if (!dangCho) { dangCho = true; requestAnimationFrame(ve); } };
    addEventListener('scroll', hoi, { passive: true });
    addEventListener('resize', hoi);
    ve();
  }
})();
