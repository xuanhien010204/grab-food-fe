export function AdminHeader() {
    return (
        <header className="bg-[#C76E00] text-white px-6 py-4 shadow-md">
            <div className="flex justify-between items-center max-w-7xl mx-auto">

                {/* Logo / Title */}
                <h1 className="text-xl font-semibold tracking-wide">
                    FoodDelivery Admin
                </h1>

                {/* Sign out button */}
                <button className="bg-white text-[#C76E00] px-5 py-2 rounded-full font-medium hover:bg-[#FFF3E6] transition shadow-sm">
                    Sign Out
                </button>

            </div>
        </header>
    );
}