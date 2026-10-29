/*
 * Form đăng ký học nghề phở.
 * Thông tin học viên được gửi tới Google Apps Script, lưu vào Google Sheets và báo về email.
 *
 * CẤU HÌNH: dán đường link Web app (kết thúc bằng /exec) lấy được khi triển khai Apps Script vào đây.
 * Xem hướng dẫn chi tiết trong file HUONG-DAN-NHAN-DANG-KY.md.
 */
const DIA_CHI_NHAN_FORM =
  "https://script.google.com/macros/s/AKfycbxakl7kHUUkEaK-flkDkWjkZT3cJr_SyWy42-p-nCXQEg8CCypqkBKh7UR1RPfQ59BNRA/exec";

(function () {
  const form = document.getElementById("form-dang-ky");
  if (!form) return;

  const nutGui = form.querySelector(".dk-submit");
  const nhanNut = nutGui.innerHTML;
  const hopLoi = form.querySelector(".dk-status");
  const hopThanhCong = document.getElementById("dk-thanh-cong");
  const daCauHinh = /^https:\/\/script\.google\.com\/.+\/exec$/.test(DIA_CHI_NHAN_FORM);

  if (!daCauHinh) {
    console.warn("[Form đăng ký] Chưa dán link Google Apps Script vào assets/dang-ky.js nên form chưa gửi được.");
  }

  // Báo lỗi ngay dưới từng ô, bằng tiếng Việt
  const thongBaoLoi = {
    ho_ten: "Vui lòng nhập họ và tên.",
    so_dien_thoai: "Vui lòng nhập số điện thoại hợp lệ (ví dụ 0974 870 000).",
    dong_y: "Vui lòng đồng ý để chúng tôi liên hệ tư vấn.",
  };

  function soChuSo(giaTri) {
    return (giaTri.match(/\d/g) || []).length;
  }

  function kiemTraO(o) {
    let loi = "";
    if (o.name === "so_dien_thoai") {
      const n = soChuSo(o.value);
      if (!o.value.trim() || n < 9 || n > 15) loi = thongBaoLoi.so_dien_thoai;
    } else if (o.type === "checkbox") {
      if (o.required && !o.checked) loi = thongBaoLoi.dong_y;
    } else if (o.required && !o.value.trim()) {
      loi = thongBaoLoi[o.name] || "Vui lòng điền thông tin này.";
    }

    const oLoi = document.getElementById(o.id + "-loi");
    if (oLoi) {
      oLoi.textContent = loi;
      oLoi.hidden = !loi;
    }
    if (o.type !== "checkbox") o.setAttribute("aria-invalid", loi ? "true" : "false");
    return !loi;
  }

  const oCanKiemTra = Array.from(form.querySelectorAll("[data-kiem-tra]"));
  oCanKiemTra.forEach(function (o) {
    o.addEventListener(o.type === "checkbox" ? "change" : "blur", function () {
      kiemTraO(o);
    });
  });

  function hienLoi(html) {
    hopLoi.innerHTML = html;
    hopLoi.hidden = false;
  }

  const loiChung =
    'Rất tiếc, chưa gửi được thông tin. Bạn vui lòng gọi <a href="tel:0974870000">097.487.0000</a> ' +
    'hoặc nhắn <a href="https://zalo.me/0974870000" target="_blank" rel="noopener">Zalo</a> để được tư vấn ngay.';

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hopLoi.hidden = true;

    let oLoiDauTien = null;
    oCanKiemTra.forEach(function (o) {
      if (!kiemTraO(o) && !oLoiDauTien) oLoiDauTien = o;
    });
    if (oLoiDauTien) {
      oLoiDauTien.focus();
      return;
    }

    // Ô bẫy bị điền => máy spam, giả vờ thành công
    if (form.website.value) {
      form.hidden = true;
      hopThanhCong.hidden = false;
      return;
    }

    if (!daCauHinh) {
      hienLoi(loiChung);
      return;
    }

    const duLieu = new URLSearchParams(new FormData(form));
    duLieu.set("trang", document.title);

    nutGui.disabled = true;
    nutGui.textContent = "Đang gửi…";
    const huy = new AbortController();
    const henGio = setTimeout(function () {
      huy.abort();
    }, 20000);

    try {
      try {
        const phanHoi = await fetch(DIA_CHI_NHAN_FORM, { method: "POST", body: duLieu, signal: huy.signal });
        const ketQua = await phanHoi.json();
        if (!ketQua.ok) throw new Error(ketQua.error || "Lỗi máy chủ");
      } catch (loi) {
        // Một số trình duyệt / tiện ích chặn đọc phản hồi từ Google (lỗi CORS) dù dữ liệu vẫn gửi được.
        // Khi đó gửi lại ở chế độ no-cors: không đọc được kết quả nhưng thông tin vẫn tới bảng tính.
        if (!(loi instanceof TypeError)) throw loi;
        console.warn("[Form đăng ký] Không đọc được phản hồi, gửi lại chế độ no-cors:", loi);
        await fetch(DIA_CHI_NHAN_FORM, { method: "POST", body: duLieu, mode: "no-cors", signal: huy.signal });
      }

      form.hidden = true;
      hopThanhCong.hidden = false;
      hopThanhCong.focus();
    } catch (loi) {
      console.error("[Form đăng ký]", loi);
      hienLoi(loiChung);
      nutGui.disabled = false;
      nutGui.innerHTML = nhanNut;
    } finally {
      clearTimeout(henGio);
    }
  });
})();
