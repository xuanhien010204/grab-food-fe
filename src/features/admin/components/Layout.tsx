export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            <aside className="w-64 bg-gray-800 text-white h-screen">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
                    <nav className="space-y-4">
                        <a href="/admin/dashboard" className="block p-2 hover:bg-gray-700 rounded">
                            Dashboard
                        </a>
                        <a href="/admin/orders" className="block p-2 hover:bg-gray-700 rounded">
                            Orders
                        </a>
                        <a href="/admin/stores" className="block p-2 hover:bg-gray-700 rounded">
                            Stores
                        </a>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 bg-gray-50">
                {children}
            </main>
        </div>
    );
}
