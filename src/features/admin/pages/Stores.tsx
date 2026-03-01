export function AdminStores() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Stores Management</h1>
            <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Add New Store
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-bold">Store Name</h3>
                    <p className="text-gray-600">Address: TBD</p>
                </div>
            </div>
        </div>
    );
}
