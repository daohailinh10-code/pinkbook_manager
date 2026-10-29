import React, { useState } from 'react';
import { UserCheck, Calendar, DollarSign } from 'lucide-react';

export default function QuanLyNhanVien() {
  const [subTab, setSubTab] = useState('tt'); // tt | lich | luong

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de]">
        <h2 className="text-xl font-bold text-[#d81b60]">Phân Hệ Quản Lý Nhân Viên</h2>
        <div className="flex gap-2">
          <button onClick={() => setSubTab('tt')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'tt' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Thông Tin Nhân Viên</button>
          <button onClick={() => setSubTab('lich')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'lich' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Lịch Làm & Chấm Công</button>
          <button onClick={() => setSubTab('luong')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'luong' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}>Quản Lý Lương</button>
        </div>
      </div>

      {/* QUẢN LÝ LƯƠNG */}
      {subTab === 'luong' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-sm text-[#d81b60]">Bảng Tính Lương Nhân Viên Tháng</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-[#806e72]"><th>Mã NV</th><th>Họ Tên</th><th>Chức Vũ</th><th>Số Ca Làm</th><th>Lương Cơ Bản</th><th>Thực Lĩnh</th></tr>
            </thead>
            <tbody>
              <tr><td className="py-2 font-bold">#NV01</td><td>Trần Thị B</td><td>Thu ngân</td><td>26 ca</td><td>6.000.000đ</td><td className="font-bold text-green-600">6.500.000đ</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}