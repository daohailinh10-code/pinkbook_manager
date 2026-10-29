import React, { useState } from 'react';
import { 
  BookOpen, ShoppingCart, Users, UserCheck, BarChart3, 
  LogOut, Search, User as UserIcon 
} from 'lucide-react';

import QuanLySach from './components/QuanLySach';
import QuanLyBanHang from './components/QuanLyBanHang';
import QuanLyKhachHang from './components/QuanLyKhachHang';
import QuanLyNhanVien from './components/QuanLyNhanVien';
import ThongKe from './components/ThongKe';

export default function App() {
  const [activeTab, setActiveTab] = useState('sach'); // sach | banhang | khachhang | nhanvien | thongke
  const [currentUser, setCurrentUser] = useState({ name: 'Quản Lý', role: 'Admin' });

  return (
    <div className="flex min-h-screen bg-[#fcf4f6] text-[#2b2325] font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-[#f7d6de] p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-3 text-[#ff5e83] mb-8 font-bold text-xl px-2">
            <BookOpen className="w-7 h-7" />
            <span>PinkBook Manager</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('sach')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'sach' ? 'bg-[#ff5e83] text-white shadow-md shadow-[#ff5e83]/30' : 'text-[#806e72] hover:bg-[#fff0f3] hover:text-[#ff5e83]'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Quản Lý Sách
            </button>

            <button
              onClick={() => setActiveTab('banhang')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'banhang' ? 'bg-[#ff5e83] text-white shadow-md shadow-[#ff5e83]/30' : 'text-[#806e72] hover:bg-[#fff0f3] hover:text-[#ff5e83]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Quản Lý Bán Hàng
            </button>

            <button
              onClick={() => setActiveTab('khachhang')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'khachhang' ? 'bg-[#ff5e83] text-white shadow-md shadow-[#ff5e83]/30' : 'text-[#806e72] hover:bg-[#fff0f3] hover:text-[#ff5e83]'
              }`}
            >
              <Users className="w-4 h-4" /> Quản Lý Khách Hàng
            </button>

            <button
              onClick={() => setActiveTab('nhanvien')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'nhanvien' ? 'bg-[#ff5e83] text-white shadow-md shadow-[#ff5e83]/30' : 'text-[#806e72] hover:bg-[#fff0f3] hover:text-[#ff5e83]'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Quản Lý Nhân Viên
            </button>

            <button
              onClick={() => setActiveTab('thongke')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl text-sm transition ${
                activeTab === 'thongke' ? 'bg-[#ff5e83] text-white shadow-md shadow-[#ff5e83]/30' : 'text-[#806e72] hover:bg-[#fff0f3] hover:text-[#ff5e83]'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Thống Kê
            </button>
          </nav>
        </div>

        <button className="w-full py-2.5 border border-[#f7d6de] text-red-600 hover:bg-red-50 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="bg-white px-8 py-4 border-b border-[#f7d6de] flex justify-between items-center">
          <div className="bg-[#fcf4f6] px-4 py-2 rounded-full flex items-center gap-3 w-80 text-sm text-[#806e72] border border-[#f7d6de]">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Tìm kiếm nhanh hệ thống..." className="bg-transparent border-none outline-none w-full text-xs" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#fff0f3] text-[#ff5e83] rounded-full flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs">{currentUser.name}</div>
              <div className="text-[10px] text-[#806e72]">{currentUser.role}</div>
            </div>
          </div>
        </header>

        {/* CONTENT DYNAMIC COMPONENT */}
        <main className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'sach' && <QuanLySach />}
          {activeTab === 'banhang' && <QuanLyBanHang />}
          {activeTab === 'khachhang' && <QuanLyKhachHang />}
          {activeTab === 'nhanvien' && <QuanLyNhanVien />}
          {activeTab === 'thongke' && <ThongKe />}
        </main>
      </div>
    </div>
  );
}