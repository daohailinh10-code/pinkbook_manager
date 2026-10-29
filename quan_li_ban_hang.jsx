import React, { useState } from 'react';
import { ShoppingCart, Truck, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function QuanLyBanHang() {
  const [subTab, setSubTab] = useState('pos'); // pos | ncc | nhap | hddauvao | hdban

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de]">
        <h2 className="text-xl font-bold text-[#d81b60]">Phân Hệ Quản Lý Bán Hàng</h2>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('pos')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'pos' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Bán Ra (POS)</button>
          <button onClick={() => setSubTab('ncc')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'ncc' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Nhà Cung Cấp</button>
          <button onClick={() => setSubTab('nhap')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'nhap' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Nhập Hàng</button>
          <button onClick={() => setSubTab('hddauvao')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'hddauvao' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Hóa Đơn Đầu Vào</button>
          <button onClick={() => setSubTab('hdban')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'hdban' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Hóa Đơn Bán Hàng</button>
        </div>
      </div>

      {/* BÁN RA (POS) */}
      {subTab === 'pos' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
            <h3 className="font-bold text-sm text-[#d81b60]">Tạo Đơn Bán Hàng Mới</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Quét mã vạch hoặc nhập tên sách..." className="flex-1 p-2 border border-[#f7d6de] rounded-xl text-xs outline-none" />
              <button className="bg-[#ff5e83] text-white px-4 text-xs font-bold rounded-xl">Thêm Vào Giỏ</button>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f7d6de] text-[#806e72]"><th>Sách</th><th>Đơn Giá</th><th>SL</th><th>Thành Tiền</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f7e8ec]">
                  <td className="py-2 font-semibold">Nhà Giả Kim</td>
                  <td>79.000đ</td>
                  <td><input type="number" defaultValue={2} className="w-12 border p-1 rounded" /></td>
                  <td>158.000đ</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#d81b60]">Thanh Toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Tổng tiền:</span><strong className="text-sm">158.000đ</strong></div>
              <div className="flex justify-between"><span>Giảm giá:</span><span>0đ</span></div>
              <div className="flex justify-between text-red-600 font-bold border-t pt-2"><span>Khách cần trả:</span><span className="text-base">158.000đ</span></div>
            </div>
            <button className="w-full bg-[#ff5e83] text-white py-3 rounded-xl font-bold text-sm shadow-md">IN HÓA ĐƠN & THANH TOÁN</button>
          </div>
        </div>
      )}

      {/* NHÀ CUNG CẤP */}
      {subTab === 'ncc' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-sm text-[#d81b60]">Danh Sách Nhà Cung Cấp Sách</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]"><th>Mã NCC</th><th>Tên Nhà Cung Cấp</th><th>Số Điện Thoại</th><th>Địa Chỉ</th></tr>
            </thead>
            <tbody>
              <tr><td className="py-2 font-bold">#NCC01</td><td>NXB Trẻ</td><td>02839316289</td><td>TP. Hồ Chí Minh</td></tr>
              <tr><td className="py-2 font-bold">#NCC02</td><td>NXB Kim Đồng</td><td>02439434730</td><td>Hà Nội</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* HÓA ĐƠN BÁN HÀNG */}
      {subTab === 'hdban' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-sm text-[#d81b60]">Lịch Sử Hóa Đơn Bán Hàng</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]"><th>Mã HD</th><th>Ngày Bán</th><th>Khách Hàng</th><th>Tổng Tiền</th><th>Trạng Thái</th></tr>
            </thead>
            <tbody>
              <tr><td className="py-2 font-bold">#HD8821</td><td>12/10/2026</td><td>Nguyễn Văn A</td><td>158.000đ</td><td><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã thanh toán</span></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}