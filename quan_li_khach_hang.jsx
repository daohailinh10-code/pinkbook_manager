import React, { useState } from 'react';
import { UserPlus, Search, Award } from 'lucide-react';

export default function QuanLyKhachHang() {
  const [subTab, setSubTab] = useState('tracuu'); // tracuu | them | thanhvien

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de]">
        <h2 className="text-xl font-bold text-[#d81b60]">Phân Hệ Quản Lý Khách Hàng</h2>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('tracuu')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'tracuu' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Tra Cứu / Cập Nhật KH</button>
          <button onClick={() => setSubTab('them')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'them' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thêm Khách Hàng Mới</button>
          <button onClick={() => setSubTab('thanhvien')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'thanhvien' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Quản Lý Thành Viên</button>
        </div>
      </div>

      {/* THÊM KHÁCH HÀNG MỚI */}
      {subTab === 'them' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 max-w-lg">
          <h3 className="font-bold text-sm text-[#d81b60]">Đăng Ký Khách Hàng Mới</h3>
          <form className="space-y-3 text-xs">
            <div><label className="block font-semibold mb-1">Họ và tên</label><input type="text" placeholder="Nhập tên KH..." className="w-full p-2 border rounded-xl outline-none" /></div>
            <div><label className="block font-semibold mb-1">Số điện thoại</label><input type="tel" placeholder="Nhập SĐT..." className="w-full p-2 border rounded-xl outline-none" /></div>
            <div><label className="block font-semibold mb-1">Email</label><input type="email" placeholder="Email..." className="w-full p-2 border rounded-xl outline-none" /></div>
            <button type="button" className="bg-[#ff5e83] text-white px-4 py-2 rounded-xl font-bold">Lưu Thông Tin Khách Hàng</button>
          </form>
        </div>
      )}

      {/* QUẢN LÝ THÀNH VIÊN */}
      {subTab === 'thanhvien' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-sm text-[#d81b60]">Danh Sách Hạng Thành Viên & Tích Điểm</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-[#806e72]"><th>Khách Hàng</th><th>SĐT</th><th>Điểm Tích Lũy</th><th>Hạng Thành Viên</th></tr>
            </thead>
            <tbody>
              <tr><td className="py-2 font-bold">Nguyễn Văn A</td><td>0987654321</td><td>1,200 điểm</td><td><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Thành viên Vàng</span></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}