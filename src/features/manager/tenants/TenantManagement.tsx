import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, X } from 'lucide-react';
import { tenantApi } from '../../../api/api';
import { toast } from 'sonner';

export default function TenantManagement() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: '' });

    const fetchTenants = async () => {
        try {
            const res = await tenantApi.getAll();
            setTenants(Array.isArray(res.data) ? res.data : []);
        } catch {
            console.error('Failed to fetch tenants');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTenants(); }, []);

    const handleSubmit = async () => {
        try {
            if (editing) {
                await tenantApi.update({ name: form.name, id: editing.id });
                toast.success('Cập nhật thành công');
            } else {
                await tenantApi.create({ name: form.name });
                toast.success('Tạo thành công');
            }
            setShowForm(false);
            setEditing(null);
            setForm({ name: '' });
            fetchTenants();
        } catch {
            toast.error('Thao tác thất bại');
        }
    };

    const handleEdit = (tenant: any) => {
        setEditing(tenant);
        setForm({
            name: tenant.name || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xoá tenant này?')) return;
        try {
            await tenantApi.delete(id);
            toast.success('Đã xoá');
            fetchTenants();
        } catch {
            toast.error('Không thể xoá');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-charcoal dark:text-cream">Quản lý Tenant</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quản lý các tenant của hệ thống</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '' }); }}
                    className="flex items-center gap-2 px-6 py-3 bg-dark-orange hover:bg-dark-orange/90 text-white font-black rounded-2xl transition-all shadow-lg shadow-dark-orange/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Tenant
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-charcoal rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-charcoal dark:text-cream tracking-tight">{editing ? 'Sửa Tenant' : 'Thêm Tenant'}</h2>
                            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text" placeholder="Tên Tenant" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-charcoal dark:text-cream focus:ring-2 focus:ring-dark-orange focus:outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => { setShowForm(false); setEditing(null); }}
                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSubmit} disabled={!form.name.trim()}
                                className="flex-1 px-4 py-3 bg-dark-orange hover:bg-dark-orange/90 text-white font-black rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-dark-orange/20"
                            >
                                {editing ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tenant List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#2d1b15] rounded-xl h-20 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : tenants.length === 0 ? (
                <div className="text-center py-20 bg-cream/40 dark:bg-charcoal rounded-3xl border border-dark-orange/10">
                    <Building2 className="w-16 h-16 text-dark-orange/20 mx-auto mb-4" />
                    <p className="text-charcoal/40 dark:text-cream/40 font-black uppercase tracking-widest italic">Chưa có tenant nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map(t => (
                        <div key={t.id} className="bg-cream/40 dark:bg-charcoal rounded-[2.5rem] border border-dark-orange/10 dark:border-gray-800 p-8 shadow-sm hover:shadow-2xl hover:shadow-dark-orange/10 transition-all duration-500 group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-dark-orange/5 rounded-full blur-2xl group-hover:bg-dark-orange/10 transition-all"></div>
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-3xl bg-dark-orange/10 flex items-center justify-center text-dark-orange border-2 border-dark-orange/20 group-hover:scale-110 transition-transform">
                                        <Building2 className="w-8 h-8 stroke-[2.5px]" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-charcoal dark:text-cream text-xl tracking-tighter uppercase italic">{t.name}</h3>
                                        {t.createTime && (
                                            <p className="text-[10px] font-black text-charcoal/30 dark:text-cream/30 uppercase tracking-[0.15em] mt-1">
                                                KHỞI TẠO: {new Date(t.createTime).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-xs text-charcoal/60 dark:text-cream/60 bg-white/50 dark:bg-gray-900/50 border border-dark-orange/10 rounded-2xl hover:bg-dark-orange hover:text-white hover:border-dark-orange font-black transition-all shadow-sm"
                                >
                                    <Edit2 className="w-4 h-4" /> SỬA
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="px-4 py-4 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-2xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
