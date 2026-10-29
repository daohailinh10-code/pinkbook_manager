import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, Users, UserCheck } from 'lucide-react';

export default function ThongKe() {
  const [subTab, setSubTab] = useState('banhang'); // banhang | kho | khachhang | nhanvien

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de]">
        <h2 className="text-xl font-bold text-[#d81b60]">Phân Hệ Báo Cáo & Thống Kê</h2>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('banhang')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'banhang' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thống Kê Bán Hàng</button>
          <button onClick={() => setSubTab('kho')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'kho' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thống Kê Kho Sách</button>
          <button onClick={() => setSubTab('khachhang')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'khachhang' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thống Kê Khách Hàng</button>
          <button onClick={() => setSubTab('nhanvien')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'nhanvien' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thống Kê Nhân Viên</button>
        </div>
      </div>

      {/* CARD BÁO CÁO NHANH */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#f7d6de]">
          <span className="text-xs text-gray-500">Doanh thu tháng</span>
          <h3 className="text-xl font-bold text-[#d81b60]">125.400.000đ</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#f7d6de]">
          <span className="text-xs text-gray-500">Tổng sách tồn kho</span>
          <h3 className="text-xl font-bold text-[#d81b60]">3,420 cuốn</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#f7d6de]">
          <span className="text-xs text-gray-500">Khách hàng mới</span>
          <h3 className="text-xl font-bold text-[#d81b60]">+128 khách</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#f7d6de]">
          <span className="text-xs text-gray-500">Hiệu suất nhân viên</span>
          <h3 className="text-xl font-bold text-[#d81b60]">98.5%</h3>
        </div>
      </div>
    </div>
  );
}