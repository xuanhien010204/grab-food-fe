export function SearchBar() {
    return (
        <div className="bg-white shadow p-4 mb-6">
            <div className="max-w-7xl mx-auto">
                <input
                    type="text"
                    placeholder="Search for food or restaurant..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
        </div>
    );
}
