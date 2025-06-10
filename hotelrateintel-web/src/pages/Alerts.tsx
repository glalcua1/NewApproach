import React, { useState } from 'react';
import Layout from '../components/Layout';
import AlertForm from '../components/AlertForm';
import AlertList from '../components/AlertList';

export interface Alert {
  id: string;
  name: string;
  hotelName: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  enabled: boolean;
  lastTriggered?: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      name: 'Competitor A Rate Drop',
      hotelName: 'Competitor Hotel A',
      condition: 'below',
      threshold: 240,
      enabled: true,
      lastTriggered: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'High Rate Alert',
      hotelName: 'Grand Plaza Hotel',
      condition: 'above',
      threshold: 300,
      enabled: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const handleAddAlert = () => {
    setEditingAlert(null);
    setShowForm(true);
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleSaveAlert = (alertData: Omit<Alert, 'id'>) => {
    if (editingAlert) {
      setAlerts(alerts.map(a => a.id === editingAlert.id ? { ...alertData, id: editingAlert.id } : a));
    } else {
      const newAlert: Alert = {
        ...alertData,
        id: Date.now().toString(),
      };
      setAlerts([...alerts, newAlert]);
    }
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Rate Alerts</h1>
          <button
            onClick={handleAddAlert}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Alert
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </h2>
            <AlertForm
              alert={editingAlert}
              onSave={handleSaveAlert}
              onCancel={handleCancel}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Active Alerts</h2>
          </div>
          <AlertList
            alerts={alerts}
            onEdit={handleEditAlert}
            onDelete={handleDeleteAlert}
            onToggle={handleToggleAlert}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Alerts; 