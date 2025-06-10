import React, { useState } from 'react';
import Layout from '../components/Layout';
import HotelForm from '../components/HotelForm';
import HotelList from '../components/HotelList';

export interface Hotel {
  id: string;
  name: string;
  location: string;
  category: string;
  isOwn: boolean;
  competitors: string[];
}

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([
    {
      id: '1',
      name: 'Grand Plaza Hotel',
      location: 'New York, NY',
      category: 'Luxury',
      isOwn: true,
      competitors: ['2', '3'],
    },
    {
      id: '2',
      name: 'Competitor Hotel A',
      location: 'New York, NY',
      category: 'Luxury',
      isOwn: false,
      competitors: [],
    },
    {
      id: '3',
      name: 'Competitor Hotel B',
      location: 'New York, NY',
      category: 'Luxury',
      isOwn: false,
      competitors: [],
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  const handleAddHotel = () => {
    setEditingHotel(null);
    setShowForm(true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setShowForm(true);
  };

  const handleSaveHotel = (hotelData: Omit<Hotel, 'id'>) => {
    if (editingHotel) {
      setHotels(hotels.map(h => h.id === editingHotel.id ? { ...hotelData, id: editingHotel.id } : h));
    } else {
      const newHotel: Hotel = {
        ...hotelData,
        id: Date.now().toString(),
      };
      setHotels([...hotels, newHotel]);
    }
    setShowForm(false);
    setEditingHotel(null);
  };

  const handleDeleteHotel = (id: string) => {
    setHotels(hotels.filter(h => h.id !== id));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHotel(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Hotel Management</h1>
          <button
            onClick={handleAddHotel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Hotel
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
            </h2>
            <HotelForm
              hotel={editingHotel}
              hotels={hotels}
              onSave={handleSaveHotel}
              onCancel={handleCancel}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your Hotels & Competitors</h2>
          </div>
          <HotelList
            hotels={hotels}
            onEdit={handleEditHotel}
            onDelete={handleDeleteHotel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default HotelManagement; 