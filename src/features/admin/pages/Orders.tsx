export function AdminOrders() {
    return (
        <div className="p-8 bg-[#FFF7ED] min-h-screen font-[Inter]">
            <h1 className="text-3xl font-bold mb-8 text-[#1F2937]">
                Orders Management
            </h1>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#FED7AA]">
                <table className="w-full">
                    <thead className="bg-[#FFEDD5]">
                        <tr>
                            <th className="p-4 text-left text-sm font-semibold text-[#1F2937]">
                                Order ID
                            </th>
                            <th className="p-4 text-left text-sm font-semibold text-[#1F2937]">
                                Customer
                            </th>
                            <th className="p-4 text-left text-sm font-semibold text-[#1F2937]">
                                Status
                            </th>
                            <th className="p-4 text-left text-sm font-semibold text-[#1F2937]">
                                Total
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr className="border-t hover:bg-[#FFF7ED] transition">
                            <td className="p-4 text-[#374151]">Loading...</td>
                            <td className="p-4 text-[#374151]">-</td>
                            <td className="p-4 text-[#374151]">-</td>
                            <td className="p-4 text-[#374151]">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}