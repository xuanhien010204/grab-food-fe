import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Settings, X } from 'lucide-react';
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
    isAvailable: true
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
    setForm({ foodId: 0, sizeId: 1, price: 0, isAvailable: true });
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!storeId || !form.foodId) return;
    try {
      await foodStoreApi.create({
        id: '00000000-0000-0000-0000-000000000000',
        storeId,
        foodId: form.foodId,
        sizeId: form.sizeId,
        price: form.price,
        isAvailable: form.isAvailable
      });
      toast.success("Đã thêm món vào menu");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Thêm món thất bại");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
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
      isAvailable: item.isAvailable ?? true
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your restaurant menu and items</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="rounded-xl bg-white dark:bg-[#2d1b15] p-6 shadow-sm border border-gray-200 dark:border-gray-800 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Categories</h3>
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
              title="Manage Categories"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${selectedCategory === 'All'
                ? 'bg-orange-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`text-left px-4 py-3 rounded-lg font-medium transition-all ${selectedCategory === category.id
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
          <div className="mt-6 p-4 rounded-lg bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-bold text-orange-800 dark:text-orange-200">Total Items</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">{menuItems.length}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#2d1b15] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Items Table */}
          <div className="rounded-xl bg-white dark:bg-[#2d1b15] shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading menu items...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Availability</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <img
                              src={item.food?.imageSrc || ''}
                              alt={item.food?.name || ''}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.food?.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300">
                              {item.food?.foodTypeName || categories.find(c => c.id === item.food?.foodTypeId)?.name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 dark:text-white">{item.price?.toLocaleString('vi-VN')}₫</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-900 dark:text-white">{item.food?.averageRating?.toFixed(1) || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${item.isAvailable
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                }`}
                            >
                              {item.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          Không có món nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredItems.length} of {menuItems.length} items
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Previous
              </button>
              <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit FoodStore Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2d1b15] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Cập nhật món' : 'Thêm món vào menu'}
            </h2>
            <div className="space-y-4 mb-6">
              {!editing && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Chọn món ăn</label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.foodId}
                    onChange={(e) => setForm({ ...form, foodId: Number(e.target.value) })}
                  >
                    <option value={0}>-- Chọn món --</option>
                    {allFoods
                      .filter(f => !menuItems.some(m => m.foodId === f.id))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                  </select>
                </div>
              )}
              {editing && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Món ăn</label>
                  <p className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white">{editing.food?.name}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Giá (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Nhập giá"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700 dark:text-gray-300">Còn hàng</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editing ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Category Management Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2d1b15] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Categories</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name"
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <button
                onClick={handleCreateCategory}
                disabled={!newCatName.trim()}
                className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group">
                  <span className="font-medium text-gray-900 dark:text-gray-200">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 bg-white dark:bg-gray-800 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
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
