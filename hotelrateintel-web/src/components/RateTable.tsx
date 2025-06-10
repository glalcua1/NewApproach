import React, { useState } from 'react';

export interface RateData {
  id: string;
  hotelName: string;
  date: string;
  source: string;
  roomType: string;
  rate: number;
  availability: boolean;
}

interface RateTableProps {
  data: RateData[];
}

const RateTable: React.FC<RateTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<keyof RateData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof RateData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getSortIcon = (field: keyof RateData) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th 
              className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => handleSort('hotelName')}
            >
              <div className="flex items-center space-x-1">
                <span>Hotel</span>
                {getSortIcon('hotelName')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center space-x-1">
                <span>Date</span>
                {getSortIcon('date')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => handleSort('source')}
            >
              <div className="flex items-center space-x-1">
                <span>Source</span>
                {getSortIcon('source')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => handleSort('roomType')}
            >
              <div className="flex items-center space-x-1">
                <span>Room Type</span>
                {getSortIcon('roomType')}
              </div>
            </th>
            <th 
              className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              onClick={() => handleSort('rate')}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Rate</span>
                {getSortIcon('rate')}
              </div>
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-600">
              Availability
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((rate, index) => (
            <tr 
              key={rate.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="py-3 px-4">
                <span className="font-medium text-gray-900">{rate.hotelName}</span>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {new Date(rate.date).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {rate.source}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{rate.roomType}</td>
              <td className="py-3 px-4 text-right">
                <span className="font-semibold text-gray-900">${rate.rate}</span>
              </td>
              <td className="py-3 px-4 text-center">
                {rate.availability ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Sold Out
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No rate data available
        </div>
      )}
    </div>
  );
};

export default RateTable; 