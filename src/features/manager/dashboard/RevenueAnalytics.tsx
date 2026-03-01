import { TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';

interface TopItem {
  name: string;
  units: number;
  maxUnits: number;
}

const RevenueAnalytics = () => {
  const stats = [
    {
      label: "Today's Revenue",
      value: '1,250,000₫',
      trend: '+12.5%',
      positive: true,
      icon: TrendingUp
    },
    {
      label: 'Total Orders',
      value: '42',
      trend: '+8%',
      positive: true,
      icon: TrendingUp
    },
    {
      label: 'Avg. Order Value',
      value: '29,760₫',
      trend: '-2.1%',
      positive: false,
      icon: TrendingDown
    }
  ];

  const topItems: TopItem[] = [
    { name: 'Traditional Banh Mi', units: 124, maxUnits: 145 },
    { name: 'Iced Milk Coffee', units: 98, maxUnits: 150 },
    { name: 'Spring Rolls (Set)', units: 76, maxUnits: 170 },
    { name: 'Phở Bò (Beef)', units: 54, maxUnits: 155 },
    { name: 'Grilled Pork Rice', units: 42, maxUnits: 170 }
  ];

  const weeklyData = [
    { day: 'Mon', value: 1.1, display: '1.1M' },
    { day: 'Tue', value: 0.8, display: '0.8M' },
    { day: 'Wed', value: 1.4, display: '1.4M' },
    { day: 'Thu', value: 1.7, display: '1.7M' },
    { day: 'Fri', value: 1.2, display: '1.2M' },
    { day: 'Sat', value: 1.5, display: '1.5M' },
    { day: 'Sun', value: 0.6, display: '0.6M' }
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.value));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            Revenue Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Real-time overview of your restaurant's financial performance
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a120b] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-900/50">
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                {stat.label}
              </p>
              <p className="text-orange-600 dark:text-orange-500 text-3xl font-black">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <IconComponent className={`w-4 h-4 ${stat.positive ? 'text-green-600' : 'text-red-600'}`} />
                <p className={`text-sm font-bold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs ml-1">vs yesterday</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#1a120b] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Weekly Performance</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Trend (Last 7 Days)</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">8,750,000₫</p>
          </div>

          <div className="grid grid-flow-col gap-4 grid-rows-[1fr_auto] items-end justify-items-center px-2 h-[240px]">
            {weeklyData.map((data, index) => (
              <div key={index} className="relative w-full group">
                <div
                  className="bg-orange-600/20 hover:bg-orange-600/40 rounded-t-lg w-full transition-all"
                  style={{ height: `${(data.value / maxValue) * 100}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {data.display}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-bold py-3">{data.day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#1a120b] shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Selling Items</h3>
          <div className="space-y-6">
            {topItems.map((item, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                  <span className="text-gray-600 dark:text-gray-400">{item.units} units</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-600 h-full rounded-full"
                    style={{ width: `${(item.units / item.maxUnits) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 text-orange-600 dark:text-orange-500 font-bold text-sm flex items-center justify-center gap-1 hover:underline">
            View All Inventory →
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
