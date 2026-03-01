export function AdminOrders() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Orders Management</h1>
            <div className="bg-white rounded shadow">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="p-3 text-left">Order ID</th>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">Loading...</td>
                            <td className="p-3">-</td>
                            <td className="p-3">-</td>
                            <td className="p-3">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
