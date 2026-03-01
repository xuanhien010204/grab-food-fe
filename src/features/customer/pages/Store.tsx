export function CustomerStore() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Store Details</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Food Items</h2>
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">Food Name</h3>
                                <p className="text-gray-600">$9.99</p>
                            </div>
                            <button className="bg-blue-500 text-white px-3 py-1 rounded">+</button>
                        </div>
                    </div>
                </div>
                <aside className="bg-white p-4 rounded shadow h-fit">
                    <h3 className="font-bold text-lg mb-4">Cart</h3>
                    <p className="text-gray-600 mb-4">Your cart is empty</p>
                    <button className="w-full bg-blue-500 text-white py-2 rounded">Checkout</button>
                </aside>
            </div>
        </div>
    );
}
