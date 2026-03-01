export function AdminHeader() {
    return (
        <header className="bg-gray-800 text-white p-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <button className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
                    Sign Out
                </button>
            </div>
        </header>
    );
}
