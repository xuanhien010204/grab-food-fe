export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#F5E6D3]">

            <aside className="w-64 bg-white shadow-lg border-r border-orange-100">
                <div className="p-6">

                    <h1 className="text-2xl font-bold text-[#C76E00] mb-8">
                        Admin Panel
                    </h1>

                    <nav className="space-y-3">

                        <a
                            href="/admin/dashboard"
                            className="block px-4 py-2 rounded-lg text-[#2E2E2E] font-medium hover:bg-orange-50 hover:text-[#C76E00] transition"
                        >
                            Dashboard
                        </a>

                        <a
                            href="/admin/orders"
                            className="block px-4 py-2 rounded-lg text-[#2E2E2E] font-medium hover:bg-orange-50 hover:text-[#C76E00] transition"
                        >
                            Orders
                        </a>

                        <a
                            href="/admin/stores"
                            className="block px-4 py-2 rounded-lg text-[#2E2E2E] font-medium hover:bg-orange-50 hover:text-[#C76E00] transition"
                        >
                            Stores
                        </a>

                    </nav>

                </div>
            </aside>

            <main className="flex-1 p-8">
                {children}
            </main>

        </div>
    );
}