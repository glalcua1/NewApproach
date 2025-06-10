import React from 'react';
import { Alert } from '../pages/Alerts';

interface AlertListProps {
  alerts: Alert[];
  onEdit: (alert: Alert) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, onEdit, onDelete, onToggle }) => {
  const formatLastTriggered = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getConditionText = (alert: Alert) => {
    switch (alert.condition) {
      case 'above':
        return `Rate above $${alert.threshold}`;
      case 'below':
        return `Rate below $${alert.threshold}`;
      case 'change':
        return `Rate change > ${alert.threshold}%`;
      default:
        return 'Unknown condition';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Alert Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hotel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Condition
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Triggered
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-3 w-3 rounded-full mr-3 ${
                    alert.enabled ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                  <div className="text-sm font-medium text-gray-900">{alert.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {alert.hotelName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {getConditionText(alert)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <button
                    onClick={() => onToggle(alert.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      alert.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        alert.enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`ml-2 text-xs font-medium ${
                    alert.enabled ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {alert.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatLastTriggered(alert.lastTriggered)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(alert)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(alert.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {alerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No alerts configured yet. Click "Create Alert" to get started.
        </div>
      )}
    </div>
  );
};

export default AlertList; 