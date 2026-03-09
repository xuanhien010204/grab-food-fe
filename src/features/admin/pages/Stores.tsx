export function AdminStores() {
    return (
        <div className="p-8 bg-[#FFF7ED] min-h-screen font-[Inter]">
            <h1 className="text-3xl font-bold mb-8 text-[#1F2937]">
                Stores Management
            </h1>

            <button className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl mb-6 font-medium shadow hover:bg-[#EA580C] transition">
                Add New Store
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-[#FED7AA] hover:shadow-lg transition">
                    <h3 className="font-semibold text-lg text-[#1F2937]">
                        Store Name
                    </h3>

                    <p className="text-[#4B5563] mt-2">
                        Address: TBD
                    </p>
                </div>
            </div>
        </div>
    );
}