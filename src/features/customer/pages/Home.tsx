export function CustomerHome() {
    return (
        <div className="p-6">
            <h1 className="text-4xl font-bold mb-6">Welcome to GrabFood</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer">
                    <div className="bg-gray-200 h-40 rounded mb-3"></div>
                    <h3 className="font-bold text-lg">Restaurant Name</h3>
                    <p className="text-gray-600 text-sm">Distance: 2km</p>
                    <p className="text-yellow-500">★★★★☆</p>
                </div>
            </div>
        </div>
    );
}
