import React, { useState, useEffect } from 'react';
import { Hotel } from '../pages/HotelManagement';

interface HotelFormProps {
  hotel: Hotel | null;
  hotels: Hotel[];
  onSave: (hotel: Omit<Hotel, 'id'>) => void;
  onCancel: () => void;
}

const HotelForm: React.FC<HotelFormProps> = ({ hotel, hotels, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    category: 'Luxury',
    isOwn: false,
    competitors: [] as string[],
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        location: hotel.location,
        category: hotel.category,
        isOwn: hotel.isOwn,
        competitors: hotel.competitors,
      });
    }
  }, [hotel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCompetitorToggle = (competitorId: string) => {
    const updatedCompetitors = formData.competitors.includes(competitorId)
      ? formData.competitors.filter(id => id !== competitorId)
      : [...formData.competitors, competitorId];
    
    setFormData({ ...formData, competitors: updatedCompetitors });
  };

  const availableCompetitors = hotels.filter(h => h.id !== hotel?.id && !h.isOwn);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hotel Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter hotel name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="City, State"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Budget">Budget</option>
            <option value="Mid-scale">Mid-scale</option>
            <option value="Upscale">Upscale</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isOwn}
              onChange={(e) => setFormData({ ...formData, isOwn: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">This is my hotel</span>
          </label>
        </div>
      </div>

      {formData.isOwn && availableCompetitors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Competitors to Track
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {availableCompetitors.map((competitor) => (
              <label key={competitor.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.competitors.includes(competitor.id)}
                  onChange={() => handleCompetitorToggle(competitor.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {competitor.name} - {competitor.location}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {hotel ? 'Update Hotel' : 'Add Hotel'}
        </button>
      </div>
    </form>
  );
};

export default HotelForm; 