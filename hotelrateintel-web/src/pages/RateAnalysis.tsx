import React, { useState } from 'react';
import Layout from '../components/Layout';
import RateTrendChart from '../components/RateTrendChart';
import RateFilters from '../components/RateFilters';
import MarketShareChart from '../components/MarketShareChart';
import RateDistributionChart from '../components/RateDistributionChart';

const RateAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('trends');

  const tabItems = [
    { id: 'trends', label: 'Rate Trends', icon: '📈' },
    { id: 'market', label: 'Market Analysis', icon: '🥧' },
    { id: 'distribution', label: 'Rate Distribution', icon: '📊' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Analysis</h1>
            <p className="mt-2 text-lg text-gray-600">
              Comprehensive insights into pricing trends and competitive positioning
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
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m3-1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export Analysis
            </button>
          </div>
        </div>

        {/* Filters */}
        <RateFilters 
          onFilterChange={() => {}}
          availableHotels={['Grand Plaza Hotel', 'Competitor Hotel A', 'Competitor Hotel B']}
          availableSources={['Booking.com', 'Expedia', 'Hotels.com']}
        />

        {/* Main Analysis Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Charts Section */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Chart Tabs */}
              <div className="border-b border-gray-200">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Rate Analytics</h3>
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      {tabItems.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span className="mr-2">{tab.icon}</span>
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
                  <RateTrendChart timeRange={timeRange} height={500} />
                )}
                {activeTab === 'market' && (
                  <MarketShareChart height={500} />
                )}
                {activeTab === 'distribution' && (
                  <RateDistributionChart height={500} />
                )}
              </div>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current ADR</span>
                  <span className="text-lg font-bold text-gray-900">$255</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Position</span>
                  <span className="text-lg font-bold text-orange-600">#2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate Spread</span>
                  <span className="text-lg font-bold text-emerald-600">$14</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Weekly Change</span>
                  <span className="text-lg font-bold text-emerald-600">+5.2%</span>
                </div>
              </div>
            </div>

            {/* Competitive Intelligence */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Intelligence</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Competitor A</span>
                    <span className="text-sm text-red-600">-2.1%</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$248</div>
                  <div className="text-xs text-gray-500">Last updated: 2 min ago</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Competitor B</span>
                    <span className="text-sm text-emerald-600">+1.8%</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$262</div>
                  <div className="text-xs text-gray-500">Last updated: 5 min ago</div>
                </div>
              </div>
            </div>

            {/* Market Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1 bg-blue-600 rounded">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-blue-900">Market Insight</h4>
              </div>
              <p className="text-sm text-blue-800">
                Premium positioning opportunity identified. Your rates are positioned optimally for the luxury segment with room for 3-5% increase.
              </p>
            </div>

            {/* Rate Recommendations */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1 bg-emerald-600 rounded">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-emerald-900">Recommendations</h4>
              </div>
              <ul className="text-sm text-emerald-800 space-y-1">
                <li>• Increase suite rates by $15-20</li>
                <li>• Monitor Competitor B pricing</li>
                <li>• Consider weekend premium</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Rate Velocity</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">+12%</div>
            <p className="text-sm text-gray-600">Average rate change velocity over the past 30 days</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Price Elasticity</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">0.73</div>
            <p className="text-sm text-gray-600">Demand sensitivity to price changes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Market Volatility</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">Low</div>
            <p className="text-sm text-gray-600">Current market rate stability index</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RateAnalysis; 