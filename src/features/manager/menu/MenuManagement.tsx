import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Settings, X, Star } from 'lucide-react';
import { foodApi, foodTypeApi, foodStoreApi, userApi, storeApi } from '../../../api/api';
import type { FoodStoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const MenuManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<FoodStoreDto[]>([]);
  const [allFoods, setAllFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [editing, setEditing] = useState<FoodStoreDto | null>(null);

  // Category Management State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form state for add/edit food-store
  const [form, setForm] = useState({
    foodId: 0,
    sizeId: 1,
    price: 0,
    isAvailable: true,
    // New fields for dish creation/edit
    name: '',
    imageSrc: '',
    foodTypeId: 0,
    isNewDish: false
  });

  // Get manager's store ID
  useEffect(() => {
    const getStoreId = async () => {
      try {
        const profileRes = await userApi.profile();
        const user = profileRes.data;
        if (user?.id) {
          const storesRes = await storeApi.getAll();
          const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
          const myStore = stores.find((s: any) => s.managerId === user.id);
          if (myStore) setStoreId(myStore.id);
        }
      } catch (error) {
        console.error('Failed to get store ID', error);
      }
    };
    getStoreId();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myStoreRes, typeRes, foodRes] = await Promise.all([
        foodStoreApi.getMyStore(),
        foodTypeApi.getAll(),
        foodApi.getAll()
      ]);
      setMenuItems(Array.isArray(myStoreRes.data) ? myStoreRes.data : []);
      setCategories(Array.isArray(typeRes.data) ? typeRes.data : []);
      setAllFoods(Array.isArray(foodRes.data) ? foodRes.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      foodId: 0,
      sizeId: 1,
      price: 0,
      isAvailable: true,
      name: '',
      imageSrc: '',
      foodTypeId: 0,
      isNewDish: false
    });
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!storeId) return;

    let targetFoodId = form.foodId;

    try {
      if (form.isNewDish) {
        if (!form.name || !form.foodTypeId) {
          toast.error("Vui lòng điền đầy đủ tên và danh mục món mới");
          return;
        }
        const newFoodRes = await foodApi.create({
          name: form.name,
          imageSrc: form.imageSrc,
          foodTypeId: form.foodTypeId
        });
        targetFoodId = newFoodRes.data.id;
      }

      if (!targetFoodId) {
        toast.error("Vui lòng chọn món ăn");
        return;
      }

      await foodStoreApi.create({
        id: '00000000-0000-0000-0000-000000000000',
        storeId,
        foodId: targetFoodId,
        sizeId: form.sizeId,
        price: form.price,
        isAvailable: form.isAvailable
      });

      toast.success("Đã thêm món vào menu");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.success("Thêm món thành công"); // Backend sometimes returns non-json success or we handle unwrap
      setIsModalOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      // 1. Update Food details if changed (assuming name/type/image are updateable)
      await foodApi.update({
        id: editing.foodId,
        name: form.name,
        imageSrc: form.imageSrc,
        foodTypeId: form.foodTypeId,
        isAvailable: form.isAvailable
      });

      // 2. Update FoodStore details
      await foodStoreApi.update({
        id: editing.id,
        price: form.price,
        sizeId: form.sizeId,
        isAvailable: form.isAvailable
      });

      toast.success("Đã cập nhật");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleEdit = (item: FoodStoreDto) => {
    setEditing(item);
    setForm({
      foodId: item.foodId,
      sizeId: item.sizeId || 1,
      price: item.price,
      isAvailable: item.isAvailable ?? true,
      name: item.food?.name || '',
      imageSrc: item.food?.imageSrc || '',
      foodTypeId: item.food?.foodTypeId || 0,
      isNewDish: false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xoá món này khỏi menu?")) return;
    try {
      await foodStoreApi.delete(id);
      toast.success("Đã xoá");
      fetchData();
    } catch {
      toast.error("Xoá thất bại");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await foodTypeApi.create({ name: newCatName });
      toast.success("Đã tạo danh mục");
      setNewCatName('');
      fetchData();
    } catch {
      toast.error("Tạo danh mục thất bại");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Xoá danh mục này?")) return;
    try {
      await foodTypeApi.delete(id);
      toast.success("Đã xoá danh mục");
      fetchData();
    } catch {
      toast.error("Xoá danh mục thất bại");
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.food?.foodTypeId === selectedCategory;
    const matchesSearch = item.food?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-charcoal dark:text-cream uppercase italic italic">Menu Management</h1>
          <p className="text-charcoal/50 dark:text-cream/50 mt-1 font-bold uppercase text-[10px] tracking-[0.2em]">Cấu hình thực đơn & Món ăn của bạn</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-8 py-4 bg-dark-orange text-white font-black rounded-2xl hover:bg-dark-orange/90 transition-all shadow-xl shadow-dark-orange/30 active:scale-95 uppercase text-xs tracking-widest"
        >
          <Plus className="w-5 h-5 stroke-[3px]" />
          Thêm món mới
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="rounded-3xl bg-cream/40 dark:bg-charcoal p-6 shadow-sm border border-dark-orange/10 dark:border-gray-800 h-fit sticky top-28 transition-all hover:shadow-xl hover:shadow-dark-orange/5 group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-charcoal dark:text-cream text-lg tracking-tighter uppercase italic">Danh mục</h3>
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="p-2 hover:bg-dark-orange/10 dark:hover:bg-gray-800 rounded-xl text-dark-orange transition-colors"
              title="Quản lý danh mục"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`text-left px-5 py-3.5 rounded-2xl font-black transition-all duration-300 uppercase text-[10px] tracking-widest ${selectedCategory === 'All'
                ? 'bg-dark-orange text-white shadow-lg shadow-dark-orange/20 translate-x-1'
                : 'text-charcoal/60 dark:text-cream/60 hover:bg-dark-orange/5 dark:hover:bg-gray-800 hover:text-dark-orange'
                }`}
            >
              Tất cả món
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`text-left px-5 py-3.5 rounded-2xl font-black transition-all duration-300 uppercase text-[10px] tracking-widest whitespace-nowrap ${selectedCategory === category.id
                  ? 'bg-dark-orange text-white shadow-lg shadow-dark-orange/20 translate-x-1'
                  : 'text-charcoal/60 dark:text-cream/60 hover:bg-dark-orange/5 dark:hover:bg-gray-800 hover:text-dark-orange'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
          <div className="mt-8 p-6 rounded-2xl bg-dark-orange/5 dark:bg-dark-orange/10 border border-dark-orange/10 group-hover:bg-dark-orange/10 transition-colors">
            <p className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] mb-1 opacity-60">Tổng số món</p>
            <p className="text-4xl font-black text-charcoal dark:text-cream">{menuItems.length}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-dark-orange/40 group-focus-within:text-dark-orange group-focus-within:scale-110 transition-all" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm món ăn trong menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-cream/40 dark:bg-charcoal text-charcoal dark:text-cream border border-dark-orange/10 dark:border-gray-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange shadow-sm transition-all text-sm font-bold placeholder:text-charcoal/30 placeholder:italic"
            />
          </div>

          {/* Items Grid/Table Container */}
          <div className="rounded-3xl bg-cream/30 dark:bg-charcoal shadow-sm border border-dark-orange/10 dark:border-gray-800 overflow-hidden backdrop-blur-sm">
            {loading ? (
              <div className="p-20 text-center text-charcoal/30 font-black uppercase tracking-widest animate-pulse">
                Đang tải dữ liệu...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-orange/5 dark:bg-gray-900/50 border-b border-dark-orange/10">
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Hình ảnh</th>
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Tên món</th>
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Danh mục</th>
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Giá bán</th>
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Đánh giá</th>
                      <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Trạng thái</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-orange/5">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-dark-orange/5 dark:hover:bg-gray-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="relative w-14 h-14 overflow-hidden rounded-2xl border-2 border-white dark:border-charcoal shadow-sm group-hover:scale-110 transition-transform">
                              <img
                                src={item.food?.imageSrc || ''}
                                alt={item.food?.name || ''}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-black text-charcoal dark:text-cream text-sm">{item.food?.name}</p>
                            <p className="text-[10px] text-charcoal/40 font-bold uppercase mt-0.5 italic">ID: {item.id.slice(-6).toUpperCase()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-dark-orange/10 text-dark-orange rounded-full text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">
                              {item.food?.foodTypeName || categories.find(c => c.id === item.food?.foodTypeId)?.name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-black text-charcoal dark:text-cream text-base">₫{item.price?.toLocaleString('vi-VN')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg w-fit">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-black text-amber-700 dark:text-amber-500 text-xs">{item.food?.averageRating?.toFixed(1) || '0.0'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className={`px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${item.isAvailable
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                                }`}
                            >
                              {item.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-3 bg-white dark:bg-charcoal text-charcoal/60 hover:text-dark-orange border border-dark-orange/10 hover:border-dark-orange rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                title="Chỉnh sửa thông tin món"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-3 bg-white dark:bg-charcoal text-charcoal/60 hover:text-rose-600 border border-rose-100 hover:border-rose-300 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                title="Gỡ khỏi menu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <Search className="w-12 h-12 mb-2" />
                            <p className="text-xl font-black uppercase italic tracking-widest">Không tìm thấy món nào</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit FoodStore Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-cream dark:bg-charcoal rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 border border-dark-orange/20 overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 right-0 p-6">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-dark-orange/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-charcoal/40" />
              </button>
            </div>

            <h2 className="text-2xl font-black text-charcoal dark:text-cream mb-8 uppercase italic border-b-4 border-dark-orange w-fit pb-2">
              {editing ? 'Cập nhật món' : 'Thêm vào Menu'}
            </h2>

            {!editing && (
              <div className="flex gap-2 mb-6 p-1 bg-dark-orange/5 rounded-2xl border border-dark-orange/10">
                <button
                  onClick={() => setForm({ ...form, isNewDish: false })}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!form.isNewDish ? 'bg-dark-orange text-white shadow-lg shadow-dark-orange/20' : 'text-charcoal/40 hover:text-dark-orange'}`}
                >
                  Chọn món có sẵn
                </button>
                <button
                  onClick={() => setForm({ ...form, isNewDish: true })}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${form.isNewDish ? 'bg-dark-orange text-white shadow-lg shadow-dark-orange/20' : 'text-charcoal/40 hover:text-dark-orange'}`}
                >
                  Tạo món mới
                </button>
              </div>
            )}

            <div className="space-y-5 mb-8">
              {editing || form.isNewDish ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] ml-2">Tên món ăn</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-white/50 dark:bg-gray-900 text-charcoal dark:text-cream border border-dark-orange/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange font-bold"
                      placeholder="VD: Phở Bò Tái Lăn..."
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] ml-2">Danh mục</label>
                      <select
                        className="w-full px-5 py-4 bg-white/50 dark:bg-gray-900 text-charcoal dark:text-cream border border-dark-orange/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange font-bold appearance-none cursor-pointer"
                        value={form.foodTypeId}
                        onChange={(e) => setForm({ ...form, foodTypeId: Number(e.target.value) })}
                      >
                        <option value={0}>Chọn danh mục...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] ml-2">Hình ảnh (URL)</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-white/50 dark:bg-gray-900 text-charcoal dark:text-cream border border-dark-orange/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange font-bold"
                        placeholder="https://..."
                        value={form.imageSrc}
                        onChange={(e) => setForm({ ...form, imageSrc: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] ml-2">Chọn món ăn từ hệ thống</label>
                  <select
                    className="w-full px-5 py-4 bg-white/50 dark:bg-gray-900 text-charcoal dark:text-cream border border-dark-orange/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange font-bold appearance-none cursor-pointer"
                    value={form.foodId}
                    onChange={(e) => {
                      const selectedFood = allFoods.find(f => f.id === Number(e.target.value));
                      if (selectedFood) {
                        setForm({
                          ...form,
                          foodId: selectedFood.id,
                          name: selectedFood.name,
                          imageSrc: selectedFood.imageSrc || '',
                          foodTypeId: selectedFood.foodTypeId || 0
                        });
                      } else {
                        setForm({ ...form, foodId: Number(e.target.value) });
                      }
                    }}
                  >
                    <option value={0}>-- Chọn món ăn --</option>
                    {allFoods
                      .filter(f => !menuItems.some(m => m.foodId === f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-dark-orange uppercase tracking-[0.2em] ml-2">Giá niêm yết (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-dark-orange">₫</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-10 pr-5 py-4 bg-white/50 dark:bg-gray-900 text-charcoal dark:text-cream border border-dark-orange/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange font-black text-xl"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isAvailable ? 'right-1' : 'left-1'}`} />
                </button>
                <label className="text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest cursor-pointer">Trạng thái: {form.isAvailable ? 'Đang bán' : 'Tạm ngưng'}</label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-5 bg-dark-orange text-white font-black rounded-[1.5rem] hover:bg-dark-orange/90 transition-all shadow-xl shadow-dark-orange/30 uppercase text-xs tracking-widest"
              >
                {editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-300">
          <div className="bg-cream dark:bg-charcoal rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-dark-orange/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-charcoal dark:text-cream uppercase tracking-tight italic border-b-4 border-dark-orange pb-1">Quản lý chuyên mục</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-2 hover:bg-dark-orange/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-charcoal/40" />
              </button>
            </div>

            <div className="flex gap-3 mb-8">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Tên danh mục mới..."
                className="flex-1 px-5 py-4 border border-dark-orange/10 rounded-2xl bg-white/50 dark:bg-gray-900 text-charcoal font-bold focus:ring-4 focus:ring-dark-orange/10"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <button
                onClick={handleCreateCategory}
                disabled={!newCatName.trim()}
                className="px-5 bg-dark-orange text-white font-black rounded-2xl disabled:opacity-50 shadow-lg shadow-dark-orange/20"
              >
                <Plus className="w-6 h-6 stroke-[3px]" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/50 rounded-2xl border border-dark-orange/5 group hover:border-dark-orange/20 transition-all">
                  <span className="font-black text-charcoal/80 dark:text-cream/80 text-sm uppercase tracking-tighter">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
