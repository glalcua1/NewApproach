import React from 'react';
import { Hotel } from '../pages/HotelManagement';

interface HotelListProps {
  hotels: Hotel[];
  onEdit: (hotel: Hotel) => void;
  onDelete: (id: string) => void;
}

const HotelList: React.FC<HotelListProps> = ({ hotels, onEdit, onDelete }) => {

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hotel Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Competitors
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {hotels.map((hotel) => (
            <tr key={hotel.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      hotel.isOwn ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {hotel.name.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hotel.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hotel.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  hotel.isOwn 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hotel.isOwn ? 'Your Hotel' : 'Competitor'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hotel.isOwn ? (
                  <span className="text-xs text-gray-400">
                    {hotel.competitors.length > 0 
                      ? `${hotel.competitors.length} competitor(s)` 
                      : 'No competitors selected'
                    }
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(hotel)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(hotel.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hotels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hotels added yet. Click "Add Hotel" to get started.
        </div>
      )}
    </div>
  );
};

export default HotelList; 