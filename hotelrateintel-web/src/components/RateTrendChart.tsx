import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RateTrendChartProps {
  timeRange?: string;
  height?: number;
}

const RateTrendChart: React.FC<RateTrendChartProps> = ({ 
  timeRange = '7d', 
  height = 400 
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const getLabelsForTimeRange = (range: string) => {
    switch (range) {
      case '1d':
        return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      case '7d':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case '30d':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '90d':
        return ['Month 1', 'Month 2', 'Month 3'];
      default:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  };

  const getDataForTimeRange = (range: string) => {
    switch (range) {
      case '1d':
        return {
          yourHotel: [245, 245, 245, 250, 255, 250, 248],
          competitorA: [235, 235, 240, 245, 250, 245, 242],
          competitorB: [255, 255, 260, 265, 270, 265, 262],
        };
      case '7d':
        return {
          yourHotel: [220, 235, 245, 240, 250, 245, 255],
          competitorA: [210, 225, 240, 235, 245, 250, 248],
          competitorB: [230, 240, 250, 245, 255, 260, 258],
        };
      case '30d':
        return {
          yourHotel: [230, 245, 250, 255],
          competitorA: [225, 240, 245, 248],
          competitorB: [240, 255, 260, 262],
        };
      case '90d':
        return {
          yourHotel: [235, 248, 255],
          competitorA: [230, 242, 248],
          competitorB: [245, 258, 262],
        };
      default:
        return {
          yourHotel: [220, 235, 245, 240, 250, 245, 255],
          competitorA: [210, 225, 240, 235, 245, 250, 248],
          competitorB: [230, 240, 250, 245, 255, 260, 258],
        };
    }
  };

  const labels = getLabelsForTimeRange(timeRange);
  const chartData = getDataForTimeRange(timeRange);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // We'll create a custom legend
      },
      title: {
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
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            return `${context[0].label}`;
          },
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y}`;
          },
          afterBody: function(context) {
            if (context.length > 1) {
              const values = context.map(item => item.parsed.y);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const diff = max - min;
              return [``, `Spread: $${diff.toFixed(0)}`];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 10,
        },
        border: {
          display: false,
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f3f4f6',
          lineWidth: 1,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 15,
          callback: function(value: any) {
            return '$' + value;
          }
        },
        border: {
          display: false,
        }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
      line: {
        borderWidth: 3,
        tension: 0.4,
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onComplete: () => setAnimationComplete(true),
    }
  };

  // Create gradient function
  const createGradient = (ctx: CanvasRenderingContext2D, color1: string, color2: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Your Hotel',
        data: chartData.yourHotel,
        borderColor: '#3b82f6',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx } = chart;
          return createGradient(ctx, 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.02)');
        },
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Competitor A',
        data: chartData.competitorA,
        borderColor: '#ef4444',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx } = chart;
          return createGradient(ctx, 'rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.02)');
        },
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#ef4444',
        pointHoverBackgroundColor: '#ef4444',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Competitor B',
        data: chartData.competitorB,
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx } = chart;
          return createGradient(ctx, 'rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.02)');
        },
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#10b981',
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const customLegend = [
    { label: 'Your Hotel', color: '#3b82f6', trend: '+5.2%', isPositive: true },
    { label: 'Competitor A', color: '#ef4444', trend: '-2.1%', isPositive: false },
    { label: 'Competitor B', color: '#10b981', trend: '+1.8%', isPositive: true },
  ];

  useEffect(() => {
    setAnimationComplete(false);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Custom Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {customLegend.map((item, index) => (
            <div 
              key={item.label}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                item.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {item.isPositive ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                <span>{item.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100"
        style={{ height: `${height}px` }}
      >
        <Line options={options} data={data} />
        
        {/* Loading Overlay */}
        {!animationComplete && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading chart data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-900">Your Performance</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">$255</div>
          <div className="text-sm text-blue-700">Current average rate</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-orange-900">Market Position</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">#2</div>
          <div className="text-sm text-orange-700">Out of 3 competitors</div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium text-emerald-900">Price Spread</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">$14</div>
          <div className="text-sm text-emerald-700">Min-max difference</div>
        </div>
      </div>
    </div>
  );
};

export default RateTrendChart; 