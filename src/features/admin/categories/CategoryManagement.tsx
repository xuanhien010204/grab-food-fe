import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { foodTypeApi } from '../../../api/api';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  imgSrc?: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await foodTypeApi.getAll();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imgSrc: ''
  });

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xoá danh mục này?')) {
      try {
        await foodTypeApi.delete(id);
        toast.success("Đã xoá danh mục");
        fetchCategories();
      } catch (error) {
        toast.error("Xoá danh mục thất bại");
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setFormData({ name: category.name, imgSrc: category.imgSrc || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await foodTypeApi.update({ id: editing.id, ...formData });
        toast.success("Đã cập nhật danh mục");
      } else {
        await foodTypeApi.create(formData);
        toast.success("Đã tạo danh mục");
      }
      setIsModalOpen(false);
      setFormData({ name: '', imgSrc: '' });
      setEditing(null);
      fetchCategories();
    } catch (error) {
      toast.error(editing ? "Cập nhật thất bại" : "Tạo danh mục thất bại");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 font-[Inter] bg-[#F5E6D3] min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-semibold text-[#2E2E2E]">
            Quản lý danh mục
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các danh mục thực phẩm cho nền tảng.
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setFormData({ name: '', imgSrc: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 h-11 rounded-full bg-[#C76E00] text-white font-medium shadow-md hover:bg-[#b86400] transition"
        >
          <Plus size={18} />
          Add Category
        </button>

      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {categories.map((category) => (

          <div
            key={category.id}
            className="bg-white rounded-2xl border border-[#F1E5D7] shadow-md hover:shadow-lg hover:-translate-y-1 transition p-6 flex flex-col"
          >

            <div className="flex justify-between items-start mb-4">

              <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center overflow-hidden text-2xl">

                {category.imgSrc
                  ? <img
                      src={category.imgSrc}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  : '🍽️'}

              </div>

            </div>

            <h3 className="font-semibold text-[#2E2E2E] text-lg">
              {category.name}
            </h3>

            <div className="flex gap-2 mt-auto pt-5">

              <button
                onClick={() => handleEdit(category)}
                className="flex-1 h-10 rounded-full bg-[#FFF7ED] text-[#2E2E2E] text-sm font-medium flex items-center justify-center gap-1 hover:bg-[#FFE6CC] transition"
              >
                <Edit2 size={16} />
                Sửa
              </button>

              <button
                onClick={() => handleDelete(category.id)}
                className="h-10 w-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-red-500 hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Modal */}
      {isModalOpen && (

        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">

          <div className="absolute inset-0 bg-black/40"></div>

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl">

            <div className="flex items-center justify-between p-6 border-b">

              <h2 className="text-lg font-semibold text-[#2E2E2E]">
                {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
              </h2>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#2E2E2E]">
                  Image URL
                </label>

                <input
                  type="text"
                  value={formData.imgSrc}
                  onChange={(e) => setFormData({ ...formData, imgSrc: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C76E00] outline-none"
                />

              </div>

              <div className="space-y-2">

                <label className="text-sm font-medium text-[#2E2E2E]">
                  Category Name
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C76E00] outline-none"
                />

              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Huỷ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#C76E00] text-white text-sm font-medium hover:bg-[#b86400]"
                >
                  {editing ? 'Cập nhật' : 'Lưu'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default CategoryManagement;