import React, { useState } from 'react';
import { Plus, Search, Tag, FileX, Edit, Trash2 } from 'lucide-react';

export default function QuanLySach() {
  const [subTab, setSubTab] = useState('xem'); // xem | them | gia | huy

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de]">
        <h2 className="text-xl font-bold text-[#d81b60]">Phân Hệ Quản Lý Sách</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setSubTab('xem')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'xem' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}
          >
            Xem & Tra Cứu
          </button>
          <button 
            onClick={() => setSubTab('them')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'them' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}
          >
            Thêm / Cập Nhật Sách
          </button>
          <button 
            onClick={() => setSubTab('gia')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'gia' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}
          >
            Thiết Lập Giá Sách
          </button>
          <button 
            onClick={() => setSubTab('huy')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${subTab === 'huy' ? 'bg-[#ff5e83] text-white' : 'bg-[#fff0f3] text-[#ff5e83]'}`}
          >
            Phiếu Xuất Hủy
          </button>
        </div>
      </div>

      {/* 1. XEM VÀ TRA CỨU SÁCH */}
      {subTab === 'xem' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#d81b60]">Danh Sách Tra Cứu Sách Trong Kho</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Nhập tên sách, tác giả..." className="px-3 py-1.5 border border-[#f7d6de] rounded-xl text-xs w-60 outline-none" />
              <button className="bg-[#ff5e83] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"><Search className="w-3.5 h-3.5"/> Tìm</button>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]">
                <th className="py-2">Mã Sách</th>
                <th>Tên Sách</th>
                <th>Thể Loại</th>
                <th>Tác Giả</th>
                <th>Giá Bán</th>
                <th>Tồn Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7e8ec]">
              <tr>
                <td className="py-3 font-bold">#BK001</td>
                <td>Nhà Giả Kim</td>
                <td><span className="bg-[#ffe0e6] text-[#ff5e83] px-2 py-0.5 rounded-full">Văn học</span></td>
                <td>Paulo Coelho</td>
                <td>79.000đ</td>
                <td>45</td>
              </tr>
              <tr>
                <td className="py-3 font-bold">#BK002</td>
                <td>Đắc Nhân Tâm</td>
                <td><span className="bg-[#f3e5f5] text-[#ab47bc] px-2 py-0.5 rounded-full">Kỹ năng</span></td>
                <td>Dale Carnegie</td>
                <td>86.000đ</td>
                <td>12</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2. THÊM / CẬP NHẬT SÁCH */}
      {subTab === 'them' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 max-w-2xl">
          <h3 className="font-bold text-sm text-[#d81b60]">Thêm / Cập Nhật Sách Mới</h3>
          <form className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Mã Sách</label>
                <input type="text" placeholder="VD: BK003" className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tên Sách</label>
                <input type="text" placeholder="Nhập tên sách..." className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Thể Loại</label>
                <input type="text" placeholder="VD: Văn học" className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tác Giả</label>
                <input type="text" placeholder="Tên tác giả..." className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none" />
              </div>
            </div>
            <button type="button" className="bg-[#ff5e83] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5"><Plus className="w-4 h-4"/> Lưu Thông Tin Sách</button>
          </form>
        </div>
      )}

      {/* 3. THIẾT LẬP GIÁ SÁCH */}
      {subTab === 'gia' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-sm text-[#d81b60]">Thiết Lập Giá Bán & Chiết Khấu</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]">
                <th className="py-2">Tên Sách</th>
                <th>Giá Nhập</th>
                <th>Giá Bán Hiện Tại</th>
                <th>Giá Bán Mới</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f7e8ec]">
                <td className="py-3 font-semibold">Nhà Giả Kim</td>
                <td>50.000đ</td>
                <td>79.000đ</td>
                <td><input type="number" defaultValue={79000} className="p-1 border border-[#f7d6de] rounded w-24 outline-none" /></td>
                <td><button className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">Cập nhật giá</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 4. TẠO PHIẾU XUẤT HỦY */}
      {subTab === 'huy' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-[#d81b60]">Tạo Phiếu Xuất Hủy Sách Lỗi / Hỏng</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Chọn Sách Cần Hủy</label>
              <select className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none">
                <option>#BK001 - Nhà Giả Kim</option>
                <option>#BK002 - Đắc Nhân Tâm</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Số Lượng Hủy</label>
              <input type="number" min="1" defaultValue={1} className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Lý Do Hủy</label>
              <textarea placeholder="VD: Sách bị rách bìa, ướt trang..." className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none h-20"></textarea>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1"><FileX className="w-4 h-4"/> Xác Nhận Xuất Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}