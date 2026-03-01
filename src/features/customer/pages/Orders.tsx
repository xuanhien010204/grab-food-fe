export function CustomerOrders() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">My Orders</h1>
            <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">Order #12345</h3>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">Delivered</span>
                    </div>
                    <p className="text-gray-600 text-sm">Restaurant Name</p>
                    <p className="font-bold mt-2">Total: $29.99</p>
                    <p className="text-gray-600 text-sm">Date: Jan 16, 2026</p>
                </div>
            </div>
        </div>
    );
}
