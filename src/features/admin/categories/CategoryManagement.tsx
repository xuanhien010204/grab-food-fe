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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Category Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Organize and manage food types for the platform.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData({ name: '', imgSrc: '' }); setIsModalOpen(true); }}
          className="flex min-w-[140px] items-center justify-center rounded-xl h-12 px-6 bg-orange-600 text-white text-sm font-bold tracking-wide shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col bg-white dark:bg-white/5 rounded-xl p-5 border border-[#f4ede6] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-14 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
                {category.imgSrc ? <img src={category.imgSrc} alt={category.name} className="w-full h-full object-cover" /> : '🥘'}
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-lg font-bold">{category.name}</h3>

            <div className="flex gap-2 mt-auto pt-4">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 h-10 rounded-lg bg-[#f4ede6] dark:bg-white/10 text-gray-900 dark:text-white text-sm font-bold flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Sửa
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="h-10 w-10 rounded-lg bg-[#f4ede6] dark:bg-white/10 text-red-500 text-sm font-bold flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-[#2c2219] rounded-xl shadow-2xl border border-[#f4ede6] dark:border-white/10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#f4ede6] dark:border-white/10 flex justify-between items-center">
              <h2 className="text-gray-900 dark:text-white text-xl font-bold">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditing(null); }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 dark:text-white text-sm font-bold">Image URL</label>
                <input
                  type="text"
                  placeholder="Image URL"
                  className="w-full rounded-lg bg-white dark:bg-white/5 border border-[#f4ede6] dark:border-white/10 px-4 py-2.5 text-sm"
                  value={formData.imgSrc}
                  onChange={(e) => setFormData({ ...formData, imgSrc: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-900 dark:text-white text-sm font-bold">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Japanese Cuisine"
                  className="w-full rounded-lg bg-white dark:bg-white/5 border border-[#f4ede6] dark:border-white/10 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none text-gray-900 dark:text-white placeholder:text-gray-500/60"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
              <button
                onClick={() => { setIsModalOpen(false); setEditing(null); }}
                className="px-5 py-2.5 rounded-xl border border-[#f4ede6] dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all"
              >
                {editing ? 'Cập nhật' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
