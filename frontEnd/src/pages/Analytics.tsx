import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Eye, Download } from 'lucide-react';
import Card from '@/components/ui/CustomCard';

const Analytics = () => {
  // Mock analytics data
  const analytics = {
    totalRevenue: 5247.83,
    totalSales: 324,
    uniqueCustomers: 189,
    totalViews: 12847,
    conversionRate: 2.5,
    avgOrderValue: 16.20,
  };

  const salesData = [
    { month: 'Jan', sales: 28, revenue: 453.72 },
    { month: 'Feb', sales: 42, revenue: 679.58 },
    { month: 'Mar', sales: 35, revenue: 567.23 },
    { month: 'Apr', sales: 58, revenue: 939.84 },
    { month: 'May', sales: 49, revenue: 794.12 },
    { month: 'Jun', sales: 67, revenue: 1087.43 },
  ];

  const topContent = [
    {
      title: 'React Advanced Patterns',
      type: 'course',
      sales: 89,
      revenue: 8009.11,
      views: 2847,
    },
    {
      title: 'Jazz Piano Collection',
      type: 'music',
      sales: 156,
      revenue: 3899.44,
      views: 4523,
    },
    {
      title: 'Photography Masterclass',
      type: 'video',
      sales: 73,
      revenue: 3284.27,
      views: 1892,
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Analytics</h1>
          <p className="text-muted-foreground text-lg">
            Track your content performance and earnings
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{analytics.totalRevenue} PYUSD</p>
                <p className="text-sm text-secondary">+23.4% from last month</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold">{analytics.totalSales}</p>
                <p className="text-sm text-secondary">+18.7% from last month</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-secondary to-primary text-white flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Unique Customers</p>
                <p className="text-2xl font-bold">{analytics.uniqueCustomers}</p>
                <p className="text-sm text-secondary">+12.3% from last month</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-6 mb-8"
        >
          <Card className="p-6 text-center">
            <Eye className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{analytics.totalViews.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">Total Views</p>
          </Card>

          <Card className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{analytics.conversionRate}%</p>
            <p className="text-muted-foreground text-sm">Conversion Rate</p>
          </Card>

          <Card className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{analytics.avgOrderValue} PYUSD</p>
            <p className="text-muted-foreground text-sm">Avg Order Value</p>
          </Card>
        </motion.div>

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Sales Over Time</h2>
            <div className="grid grid-cols-6 gap-4">
              {salesData.map((data, index) => (
                <div key={data.month} className="text-center">
                  <div 
                    className="bg-gradient-to-t from-primary to-secondary rounded-t-lg mx-auto mb-2"
                    style={{ 
                      height: `${(data.sales / Math.max(...salesData.map(d => d.sales))) * 120}px`,
                      width: '24px'
                    }}
                  />
                  <p className="text-sm font-medium">{data.sales}</p>
                  <p className="text-xs text-muted-foreground">{data.month}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Performing Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Top Performing Content</h2>
            <div className="space-y-4">
              {topContent.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{item.sales}</p>
                      <p className="text-muted-foreground">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-primary">{item.revenue} PYUSD</p>
                      <p className="text-muted-foreground">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{item.views}</p>
                      <p className="text-muted-foreground">Views</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;