export function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white shadow">
                <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[#C76E00]">FoodDelivery</h1>
                    <ul className="flex gap-6">
                        <li><a href="/" className="hover:text-[#C76E00]">Home</a></li>
                        <li><a href="/orders" className="hover:text-[#C76E00]">My Orders</a></li>
                        <li><a href="/profile" className="hover:text-[#C76E00]">Profile</a></li>
                    </ul>
                </nav>
            </header>
            <main className="flex-1 bg-gray-50">
                {children}
            </main>
            <footer className="bg-gray-800 text-white p-4 text-center">
                <p>&copy; 2026 FoodDelivery. All rights reserved.</p>
            </footer>
        </div>
    );
}
