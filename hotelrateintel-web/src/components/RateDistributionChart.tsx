import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RateDistributionChartProps {
  height?: number;
}

const RateDistributionChart: React.FC<RateDistributionChartProps> = ({ height = 300 }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Executive'];
  const rateData = {
    yourHotel: [180, 245, 320, 450],
    competitorA: [170, 235, 310, 440],
    competitorB: [190, 255, 330, 460],
  };

  const options: ChartOptions<'bar'> = {
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
          title: function(context) {
            return `${context[0].label} Room`;
          },
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y}`;
          },
          afterBody: function(context) {
            if (context.length > 1) {
              const yourRate = context.find(item => item.dataset.label === 'Your Hotel')?.parsed.y;
              const competitors = context.filter(item => item.dataset.label !== 'Your Hotel');
              if (yourRate && competitors.length > 0) {
                const avgCompetitor = competitors.reduce((sum, item) => sum + item.parsed.y, 0) / competitors.length;
                const diff = yourRate - avgCompetitor;
                const status = diff > 0 ? 'above' : 'below';
                return [``, `You're $${Math.abs(diff).toFixed(0)} ${status} average`];
              }
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
        },
        border: {
          display: false,
        }
      },
      y: {
        beginAtZero: true,
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
          callback: function(value: any) {
            return '$' + value;
          }
        },
        border: {
          display: false,
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
      onComplete: () => setAnimationComplete(true),
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      }
    }
  };

  const data = {
    labels: roomTypes,
    datasets: [
      {
        label: 'Your Hotel',
        data: rateData.yourHotel,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
      {
        label: 'Competitor A',
        data: rateData.competitorA,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)',
      },
      {
        label: 'Competitor B',
        data: rateData.competitorB,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
      },
    ],
  };

  const legendItems = [
    { label: 'Your Hotel', color: '#3b82f6' },
    { label: 'Competitor A', color: '#ef4444' },
    { label: 'Competitor B', color: '#10b981' },
  ];

  const getRoomTypeInsight = () => {
    const suiteIndex = roomTypes.indexOf('Suite');
    const yourSuiteRate = rateData.yourHotel[suiteIndex];
    const competitorASuiteRate = rateData.competitorA[suiteIndex];
    const competitorBSuiteRate = rateData.competitorB[suiteIndex];
    
    const avgCompetitorSuite = (competitorASuiteRate + competitorBSuiteRate) / 2;
    const diff = yourSuiteRate - avgCompetitorSuite;
    
    return {
      isHigher: diff > 0,
      amount: Math.abs(diff),
      percentage: Math.abs((diff / avgCompetitorSuite) * 100)
    };
  };

  const insight = getRoomTypeInsight();

  useEffect(() => {
    setAnimationComplete(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Custom Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {legendItems.map((item, index) => (
          <div 
            key={item.label}
            className={`flex items-center space-x-2 transition-all duration-300 ${
              animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div 
              className="w-4 h-4 rounded border-2 border-white shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100"
        style={{ height: `${height}px` }}
      >
        <Bar options={options} data={data} />
        
        {/* Loading Overlay */}
        {!animationComplete && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading rate data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Room Type Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roomTypes.map((roomType, index) => {
          const yourRate = rateData.yourHotel[index];
          const avgCompetitor = (rateData.competitorA[index] + rateData.competitorB[index]) / 2;
          const diff = yourRate - avgCompetitor;
          const isHigher = diff > 0;
          
          return (
            <div 
              key={roomType}
              className={`bg-white rounded-lg p-4 border transition-all duration-300 ${
                animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isHigher ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">${yourRate}</div>
                <div className="text-sm text-gray-600 mb-2">{roomType}</div>
                <div className={`text-xs font-medium ${
                  isHigher ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {isHigher ? '+' : ''}${diff.toFixed(0)} vs avg
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rate Analysis Insight */}
      <div className={`rounded-lg p-4 border ${
        insight.isHigher 
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
          : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 p-2 rounded-lg ${
            insight.isHigher ? 'bg-emerald-100' : 'bg-orange-100'
          }`}>
            {insight.isHigher ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <div>
            <h4 className={`text-sm font-medium mb-1 ${
              insight.isHigher ? 'text-emerald-800' : 'text-orange-800'
            }`}>
              Suite Rate Analysis
            </h4>
            <p className={`text-sm ${
              insight.isHigher ? 'text-emerald-700' : 'text-orange-700'
            }`}>
              Your suite rates are ${insight.amount.toFixed(0)} ({insight.percentage.toFixed(1)}%) {' '}
              {insight.isHigher ? 'above' : 'below'} competitor average. {' '}
              {insight.isHigher 
                ? 'Strong premium positioning in the luxury segment.'
                : 'Consider adjusting pricing strategy for better market positioning.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateDistributionChart; 