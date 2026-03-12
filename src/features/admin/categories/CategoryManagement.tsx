import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { foodTypeApi } from '../../../api/api';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
    imgSrc?: string;
}

const CategoryManagement = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-orange-100/50 shadow-sm">
                <div className="border-l-4 border-[#C76E00] pl-4">
                    <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">Quản lý danh mục</h1>
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                        Cấu hình phân loại món ăn toàn hệ thống
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ name: '', imgSrc: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#C76E00] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#A55B00] transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Thêm danh mục
                </button>
            </div>

            {/* Category Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] h-48 animate-pulse border border-orange-100/50" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group bg-white rounded-[2rem] border border-orange-100/50 p-6 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all relative overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[2rem] bg-cream flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform overflow-hidden shadow-inner">
                                    {category.imgSrc ? (
                                        <img
                                            src={category.imgSrc}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl text-[#C76E00]/30 italic font-black">?</span>
                                    )}
                                </div>
                                <h3 className="mt-6 font-black text-xl text-charcoal tracking-tighter italic group-hover:text-[#C76E00] transition-colors uppercase">
                                    {category.name}
                                </h3>
                                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mt-1">ID: #{category.id}</p>
                            </div>

                            <div className="flex gap-2 mt-8 pt-6 border-t border-orange-50">
                                <button
                                    onClick={() => handleEdit(category)}
                                    className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-charcoal/60 hover:bg-[#C76E00]/10 hover:text-[#C76E00] rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="px-4 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-cream rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-orange-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-charcoal tracking-tighter uppercase italic">
                                {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center hover:bg-charcoal/5 rounded-full transition-colors">
                                <X className="w-6 h-6 text-charcoal/40" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Tên danh mục</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    placeholder="Nhập tên danh mục..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">URL hình ảnh</label>
                                <input
                                    type="text"
                                    value={formData.imgSrc}
                                    onChange={(e) => setFormData({ ...formData, imgSrc: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.imgSrc && (
                                    <div className="mt-4 w-full h-32 rounded-2xl bg-white border border-orange-100 overflow-hidden">
                                        <img src={formData.imgSrc} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 border-2 border-orange-100 text-charcoal/60 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-charcoal/5 transition-all"
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-[#C76E00] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#A55B00] transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95"
                                >
                                    {editing ? 'Cập nhật' : 'Lưu lại'}
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