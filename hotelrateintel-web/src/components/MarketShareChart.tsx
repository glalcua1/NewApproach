import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MarketShareChartProps {
  height?: number;
}

const MarketShareChart: React.FC<MarketShareChartProps> = ({ height = 300 }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const marketData = [
    { label: 'Your Hotel', value: 35, color: '#3b82f6', revenue: '$2.1M' },
    { label: 'Competitor A', value: 28, color: '#ef4444', revenue: '$1.7M' },
    { label: 'Competitor B', value: 22, color: '#10b981', revenue: '$1.3M' },
    { label: 'Others', value: 15, color: '#6b7280', revenue: '$0.9M' },
  ];

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const revenue = marketData[context.dataIndex].revenue;
            return [`${label}: ${value}%`, `Revenue: ${revenue}`];
          }
        }
      }
    },
    cutout: '65%',
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onComplete: () => setAnimationComplete(true),
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderWidth: 3,
      }
    }
  };

  const data = {
    labels: marketData.map(item => item.label),
    datasets: [
      {
        data: marketData.map(item => item.value),
        backgroundColor: marketData.map(item => item.color),
        hoverBackgroundColor: marketData.map(item => item.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  useEffect(() => {
    setAnimationComplete(false);
  }, []);

  const totalRevenue = marketData.reduce((sum, item) => {
    const value = parseFloat(item.revenue.replace('$', '').replace('M', ''));
    return sum + value;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Chart Container */}
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100"
        style={{ height: `${height}px` }}
      >
        <Doughnut options={options} data={data} />
        
        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(1)}M</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
        </div>

        {/* Loading Overlay */}
        {!animationComplete && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading market data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Legend */}
      <div className="space-y-3">
        {marketData.map((item, index) => (
          <div 
            key={item.label}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
              animationComplete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
            style={{ 
              transitionDelay: `${index * 100}ms`,
              backgroundColor: item.color + '10',
              borderLeft: `4px solid ${item.color}`
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{item.value}%</div>
              <div className="text-xs text-gray-500">{item.revenue}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Market Insight</h4>
            <p className="text-sm text-blue-700">
              You're leading the market with 35% share. Focus on maintaining your competitive edge in the luxury segment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketShareChart; 