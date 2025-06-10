import React, { useState } from 'react';

interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  priceRange: {
    min: number | null;
    max: number | null;
  };
  sources: string[];
  hotels: string[];
}

interface RateFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  availableHotels: string[];
  availableSources: string[];
}

const RateFilters: React.FC<RateFiltersProps> = ({ 
  onFilterChange, 
  availableHotels, 
  availableSources 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: '',
      end: '',
    },
    priceRange: {
      min: null,
      max: null,
    },
    sources: [],
    hotels: [],
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const handleFilterUpdate = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSourceToggle = (source: string) => {
    const updatedSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    handleFilterUpdate({ sources: updatedSources });
  };

  const handleHotelToggle = (hotel: string) => {
    const updatedHotels = filters.hotels.includes(hotel)
      ? filters.hotels.filter(h => h !== hotel)
      : [...filters.hotels, hotel];
    handleFilterUpdate({ hotels: updatedHotels });
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: { start: '', end: '' },
      priceRange: { min: null, max: null },
      sources: [],
      hotels: [],
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.sources.length > 0) count++;
    if (filters.hotels.length > 0) count++;
    return count;
  };

  const quickDateRanges = [
    { label: 'Today', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: 'Last 7 days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: 'Last 30 days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filter Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <p className="text-sm text-gray-500">
                {getActiveFilterCount() > 0 ? `${getActiveFilterCount()} active filter${getActiveFilterCount() > 1 ? 's' : ''}` : 'No filters applied'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-6 space-y-6">
          
          {/* Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="font-medium text-gray-900">Date Range</h4>
            </div>
            
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickDateRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handleFilterUpdate({ 
                    dateRange: { start: range.start, end: range.end } 
                  })}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterUpdate({ 
                    dateRange: { ...filters.dateRange, start: e.target.value } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterUpdate({ 
                    dateRange: { ...filters.dateRange, end: e.target.value } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Price Range Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h4 className="font-medium text-gray-900">Price Range</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={filters.priceRange.min || ''}
                    onChange={(e) => handleFilterUpdate({ 
                      priceRange: { 
                        ...filters.priceRange, 
                        min: e.target.value ? Number(e.target.value) : null 
                      } 
                    })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={filters.priceRange.max || ''}
                    onChange={(e) => handleFilterUpdate({ 
                      priceRange: { 
                        ...filters.priceRange, 
                        max: e.target.value ? Number(e.target.value) : null 
                      } 
                    })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="999"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sources and Hotels Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                <h4 className="font-medium text-gray-900">Sources</h4>
                {filters.sources.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {filters.sources.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {availableSources.map((source) => (
                  <label key={source} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.sources.includes(source)}
                      onChange={() => handleSourceToggle(source)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                    />
                    <span className="text-sm text-gray-700 font-medium">{source}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hotels */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h4 className="font-medium text-gray-900">Hotels</h4>
                {filters.hotels.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {filters.hotels.length}
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableHotels.map((hotel) => (
                  <label key={hotel} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hotels.includes(hotel)}
                      onChange={() => handleHotelToggle(hotel)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                    />
                    <span className="text-sm text-gray-700 font-medium">{hotel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateFilters; 