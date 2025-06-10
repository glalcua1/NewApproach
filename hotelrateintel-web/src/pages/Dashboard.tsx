import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import RateTrendChart from '../components/RateTrendChart';
import MetricCard from '../components/MetricCard';
import MarketShareChart from '../components/MarketShareChart';
import RateDistributionChart from '../components/RateDistributionChart';

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [animateCards, setAnimateCards] = useState(false);
  const [activeTab, setActiveTab] = useState('trends');

  // Mock data for demonstration
  const metrics = [
    {
      title: 'Average Rate',
      value: '$245',
      change: '+5.2%',
      changeType: 'increase' as const,
    },
    {
      title: 'Rate Position',
      value: '#3',
      change: '+1 position',
      changeType: 'increase' as const,
    },
    {
      title: 'Competitor Gap',
      value: '$12',
      change: '-$3',
      changeType: 'decrease' as const,
    },
    {
      title: 'Rate Changes',
      value: '7',
      change: '+2 today',
      changeType: 'neutral' as const,
    },
  ];

  const quickStats = [
    { label: 'Hotels Monitored', value: '24' },
    { label: 'Active Alerts', value: '12' },
    { label: 'Data Points Today', value: '1,248' },
    { label: 'Accuracy Rate', value: '99.7%' },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'rate_update',
      message: 'Booking.com rate updated for Grand Plaza Hotel',
      time: '2 min ago',
      status: 'success',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 2,
      type: 'competitor_new',
      message: 'New competitor detected: Luxury Inn Downtown',
      time: '15 min ago',
      status: 'info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      type: 'alert_triggered',
      message: 'Rate alert triggered for Competitor Hotel A',
      time: '1 hour ago',
      status: 'warning',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    {
      id: 4,
      type: 'system',
      message: 'Daily scraping completed successfully',
      time: '2 hours ago',
      status: 'success',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    setAnimateCards(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 bg-emerald-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const tabItems = [
    { id: 'trends', label: 'Rate Trends', icon: '📈' },
    { id: 'market', label: 'Market Share', icon: '🥧' },
    { id: 'distribution', label: 'Rate Distribution', icon: '📊' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="mt-2 text-lg text-gray-600">
              Here's what's happening with your hotel rates today.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 transform transition-all duration-500 ${
                animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`transform transition-all duration-700 ${
                animateCards ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${200 + index * 150}ms` }}
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Charts Area */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Chart Tabs */}
              <div className="border-b border-gray-200">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      {tabItems.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span className="mr-1">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {activeTab === 'trends' && (
                  <RateTrendChart timeRange={timeRange} height={400} />
                )}
                {activeTab === 'market' && (
                  <MarketShareChart height={400} />
                )}
                {activeTab === 'distribution' && (
                  <RateDistributionChart height={400} />
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 group hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-900">Create Alert</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m3-1a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-emerald-900">Export Data</span>
                  </div>
                </button>

                <button className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 group-hover:bg-orange-200 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-orange-900">Settings</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Market Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Market Position</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Your average rate is 5.2% higher than last week, positioning you competitively in the luxury segment.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">vs Competitor A</span>
                <span className="font-medium text-emerald-600">+$15 advantage</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">vs Competitor B</span>
                <span className="font-medium text-red-600">-$8 behind</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            </div>
            <p className="text-gray-700 mb-4">
              All systems operating normally. 99.7% uptime with real-time rate monitoring across 24 properties.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Scrape</span>
                <span className="font-medium text-gray-900">2 minutes ago</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Next Update</span>
                <span className="font-medium text-gray-900">In 13 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 