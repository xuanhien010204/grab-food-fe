import { Users, Store, ShoppingBag, DollarSign, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const REVENUE_DATA = [
    { name: 'Mon', revenue: 4000, orders: 24 },
    { name: 'Tue', revenue: 3000, orders: 18 },
    { name: 'Wed', revenue: 5500, orders: 35 },
    { name: 'Thu', revenue: 4500, orders: 28 },
    { name: 'Fri', revenue: 8000, orders: 55 },
    { name: 'Sat', revenue: 9500, orders: 62 },
    { name: 'Sun', revenue: 7000, orders: 45 },
];

const CATEGORY_DATA = [
    { name: 'Món Việt', value: 35, color: '#FF7F00' },
    { name: 'Fast Food', value: 28, color: '#3B82F6' },
    { name: 'Đồ uống', value: 20, color: '#10B981' },
    { name: 'Others', value: 17, color: '#6366F1' },
];

const PENDING_STORES = [
    { id: 1, name: 'Phở 24/7', category: 'Món Việt', email: 'pho247@email.com', phone: '0901234567' },
    { id: 2, name: 'Burger King VN', category: 'Fast Food', email: 'burger@contact.com', phone: '0912345678' },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Total Users', value: '2,458', sub: '2,103 Active', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { title: 'Total Stores', value: '156', sub: '12 Pending', icon: Store, color: 'text-green-600', bg: 'bg-green-100' },
                    { title: "Today's Orders", value: '342', sub: '+15% vs yesterday', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
                    { title: 'Total Revenue', value: '25.8M', sub: 'Today: 850K', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
                ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* REVENUE CHART */}
                <div className="lg:col-span-2">
                    <Card className="shadow-sm h-full border-none">
                        <CardHeader>
                            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={REVENUE_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="revenue" stroke="#FF7F00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* CATEGORY PIE CHART */}
                <div>
                    <Card className="shadow-sm h-full border-none">
                        <CardHeader>
                            <CardTitle>Category Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={CATEGORY_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {CATEGORY_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend verticalAlign="bottom" height={36} />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PENDING STORES */}
            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>⏳ Pending Store Approvals</CardTitle>
                    <Button variant="ghost" size="sm" className="text-orange-600">View All Stores →</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {PENDING_STORES.map((store) => (
                            <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <h4 className="font-bold text-gray-900">{store.name}</h4>
                                        <Badge variant="warning">Pending</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{store.category} • {store.email}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                                        <Check className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                                        <X className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
