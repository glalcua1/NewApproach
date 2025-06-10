import React, { useState, useEffect } from 'react';
import { Alert } from '../pages/Alerts';

interface AlertFormProps {
  alert?: Alert | null;
  onSave: (alert: Omit<Alert, 'id'>) => void;
  onCancel: () => void;
}

const AlertForm: React.FC<AlertFormProps> = ({ alert, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    hotelName: '',
    condition: 'below' as 'above' | 'below' | 'change',
    threshold: 0,
    enabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock hotel data - in a real app, this would come from props or API
  const availableHotels = [
    'Grand Plaza Hotel',
    'Competitor Hotel A',
    'Competitor Hotel B',
  ];

  useEffect(() => {
    if (alert) {
      setFormData({
        name: alert.name,
        hotelName: alert.hotelName,
        condition: alert.condition,
        threshold: alert.threshold,
        enabled: alert.enabled,
      });
    }
  }, [alert]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required';
    }

    if (!formData.hotelName) {
      newErrors.hotelName = 'Please select a hotel';
    }

    if (formData.threshold <= 0) {
      newErrors.threshold = 'Threshold must be greater than 0';
    }

    if (formData.condition === 'change' && formData.threshold > 100) {
      newErrors.threshold = 'Percentage change cannot exceed 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave(formData);
    setIsSubmitting(false);
  };

  const getConditionDescription = () => {
    switch (formData.condition) {
      case 'above':
        return 'when rate goes above';
      case 'below':
        return 'when rate goes below';
      case 'change':
        return 'when rate changes by more than';
      default:
        return 'when condition is met';
    }
  };

  const getConditionIcon = () => {
    switch (formData.condition) {
      case 'above':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
          </svg>
        );
      case 'below':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      case 'change':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 20.354A7.966 7.966 0 003 15a8 8 0 1116 0 7.966 7.966 0 00-1.868 5.354" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {alert ? 'Edit Alert' : 'Create New Alert'}
              </h3>
              <p className="text-sm text-gray-500">Set up notifications for rate changes</p>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors({ ...errors, name: '' });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Competitor Rate Drop Alert"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.hotelName}
                    onChange={(e) => {
                      setFormData({ ...formData, hotelName: e.target.value });
                      if (errors.hotelName) {
                        setErrors({ ...errors, hotelName: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none ${
                      errors.hotelName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a hotel</option>
                    {availableHotels.map((hotel) => (
                      <option key={hotel} value={hotel}>
                        {hotel}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.hotelName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.hotelName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Alert Conditions */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Alert Conditions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'below', label: 'Rate goes below', color: 'green' },
                    { value: 'above', label: 'Rate goes above', color: 'red' },
                    { value: 'change', label: 'Rate changes by more than', color: 'blue' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="condition"
                        value={option.value}
                        checked={formData.condition === option.value}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        {formData.condition === option.value && getConditionIcon()}
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold {formData.condition === 'change' ? '(%)' : '($)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">
                      {formData.condition === 'change' ? '%' : '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step={formData.condition === 'change' ? '0.1' : '1'}
                    max={formData.condition === 'change' ? '100' : undefined}
                    value={formData.threshold}
                    onChange={(e) => {
                      setFormData({ ...formData, threshold: Number(e.target.value) });
                      if (errors.threshold) {
                        setErrors({ ...errors, threshold: '' });
                      }
                    }}
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.threshold ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={formData.condition === 'change' ? '5.0' : '250'}
                  />
                </div>
                {errors.threshold && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.threshold}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Settings</h4>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${formData.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {formData.enabled ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 20.354A7.966 7.966 0 003 15a8 8 0 1116 0 7.966 7.966 0 00-1.868 5.354" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable this alert</p>
                  <p className="text-xs text-gray-500">
                    {formData.enabled ? 'Alert is active and will send notifications' : 'Alert is disabled'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Alert Preview */}
          {formData.hotelName && formData.threshold > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Alert Preview</h4>
                  <p className="text-sm text-blue-700">
                    You will be notified {getConditionDescription()} {formData.condition === 'change' ? '' : '$'}{formData.threshold}
                    {formData.condition === 'change' ? '%' : ''} for <strong>{formData.hotelName}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>{isSubmitting ? 'Saving...' : (alert ? 'Update Alert' : 'Create Alert')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlertForm; 