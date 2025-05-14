import { useState } from 'react';
import { Camera, Info, Check, X, ChevronDown, Eye } from 'lucide-react';

// Mock enum values that would come from your actual schema
const MeasurementUnit = {
  CUBIC_METER: 'CUBIC_METER',
  CUBIC_FEET: 'CUBIC_FEET',
  SQUARE_METER: 'SQUARE_METER',
  SQUARE_FEET: 'SQUARE_FEET',
  METER: 'METER',
  FEET: 'FEET',
  COUNT: 'COUNT',
  WEIGHT_KG: 'WEIGHT_KG',
  WEIGHT_LB: 'WEIGHT_LB',
};

const InventoryPolicy = {
  FIFO: 'FIFO',
  LIFO: 'LIFO',
  FEFO: 'FEFO',
  NONE: 'NONE',
};

const CreateOrganizationPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: null,
    
    // Expense Settings
    expenseApprovalRequired: false,
    expenseApprovalThreshold: null,
    expenseReceiptRequired: true,
    expenseReceiptThreshold: null,
    expenseTagOptions: [],
    
    // General Settings
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    defaultTaxRate: null,
    
    // Inventory Settings
    inventoryPolicy: InventoryPolicy.FEFO,
    lowStockThreshold: 10,
    negativeStock: false,
    
    // Spatial Settings
    enableCapacityTracking: false,
    enforceSpatialConstraints: false,
    enableProductDimensions: false,
    defaultMeasurementUnit: MeasurementUnit.METER,
    defaultDimensionUnit: MeasurementUnit.METER,
    defaultWeightUnit: MeasurementUnit.WEIGHT_KG,
  });
  
  const [activeSection, setActiveSection] = useState('organization');
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  
  // Timezoones list example
  const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 
    'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'
  ];
  
  // Currencies list example
  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' ? null : Number(value),
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  const handleAddTag = () => {
    if (newTag && !formData.expenseTagOptions.includes(newTag)) {
      setFormData({
        ...formData,
        expenseTagOptions: [...formData.expenseTagOptions, newTag],
      });
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      expenseTagOptions: formData.expenseTagOptions.filter(t => t !== tag),
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = "Organization name is required.";
    }
    
    if (!formData.slug) {
      newErrors.slug = "Slug is required.";
    } else if (formData.slug.length < 2) {
      newErrors.slug = "Slug must be at least 2 characters.";
    } else if (formData.slug.length > 30) {
      newErrors.slug = "Slug must not exceed 30 characters.";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters.";
    }
    
    // Add more validations as needed for other fields

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Submit form data
      console.log("Form submitted:", formData);
      // Here you would typically send the data to your API
    }
  };
  
  const nextStep = () => {
    if (validateForm()) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const formatSlug = (text) => {
    return text.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };
  
  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      name: value,
      // Auto-generate slug if the user hasn't manually edited it
      slug: formData.slug === formatSlug(formData.name) ? formatSlug(value) : formData.slug,
    });
    
    if (errors.name) {
      setErrors({
        ...errors,
        name: undefined,
      });
    }
  };
  
  const handleSlugChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      slug: formatSlug(value),
    });
    
    if (errors.slug) {
      setErrors({
        ...errors,
        slug: undefined,
      });
    }
  };
  
  // Mock function for file upload
  const handleLogoChange = (e) => {
    // In a real app, you would handle file upload to get a URL
    setFormData({
      ...formData,
      logo: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null,
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create New Organization</h1>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <div className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Organization Details</div>
              <div className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Expense Settings</div>
              <div className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>General Settings</div>
              <div className={`text-sm font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-500'}`}>Inventory & Spatial</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Organization Details */}
            {step === 1 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Organization Details</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Set up the basic information for your organization.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Logo upload */}
                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">Organization Logo</label>
                      <div className="mt-1 flex items-center">
                        <div className="h-24 w-24 rounded-md border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                          {formData.logo ? (
                            <img src={formData.logo} alt="Logo preview" className="h-full w-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-5">
                          <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span>Upload a file</span>
                            <input 
                              id="logo-upload" 
                              name="logo-upload" 
                              type="file" 
                              accept="image/*"
                              className="sr-only" 
                              onChange={handleLogoChange}
                            />
                          </label>
                          <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG, GIF up to 2MB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Organization name */}
                    <div className="sm:col-span-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Organization Name <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleNameChange}
                          className={`block w-full rounded-md ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} sm:text-sm`}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        The official name of your organization.
                      </p>
                    </div>
                    
                    {/* Slug */}
                    <div className="sm:col-span-4">
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          myapp.com/org/
                        </span>
                        <input
                          type="text"
                          name="slug"
                          id="slug"
                          value={formData.slug}
                          onChange={handleSlugChange}
                          className={`flex-1 min-w-0 block rounded-none rounded-r-md ${errors.slug ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} sm:text-sm`}
                        />
                      </div>
                      {errors.slug && (
                        <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Used for your organization's URL. Only lowercase letters, numbers, and hyphens.
                      </p>
                    </div>
                    
                    {/* Description */}
                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          value={formData.description || ''}
                          onChange={handleChange}
                          className={`block w-full rounded-md ${errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} sm:text-sm`}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Brief description of your organization.
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.description?.length || 0)}/500
                        </p>
                      </div>
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Expense Settings */}
            {step === 2 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Expense Settings</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Configure how expenses are managed within your organization.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Expense Approval */}
                    <div className="sm:col-span-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="expenseApprovalRequired"
                            name="expenseApprovalRequired"
                            type="checkbox"
                            checked={formData.expenseApprovalRequired}
                            onChange={handleChange}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="expenseApprovalRequired" className="font-medium text-gray-700">
                            Require expense approval
                          </label>
                          <p className="text-gray-500">
                            All expenses will require approval before processing.
                          </p>
                        </div>
                      </div>
                      
                      {formData.expenseApprovalRequired && (
                        <div className="mt-4 ml-7">
                          <label htmlFor="expenseApprovalThreshold" className="block text-sm font-medium text-gray-700">
                            Approval threshold
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="expenseApprovalThreshold"
                              id="expenseApprovalThreshold"
                              value={formData.expenseApprovalThreshold || ''}
                              onChange={handleNumberChange}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Only expenses above this amount require approval. Leave empty to require approval for all expenses.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Receipt Required */}
                    <div className="sm:col-span-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="expenseReceiptRequired"
                            name="expenseReceiptRequired"
                            type="checkbox"
                            checked={formData.expenseReceiptRequired}
                            onChange={handleChange}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="expenseReceiptRequired" className="font-medium text-gray-700">
                            Require receipts
                          </label>
                          <p className="text-gray-500">
                            Expenses will require receipt attachments.
                          </p>
                        </div>
                      </div>
                      
                      {formData.expenseReceiptRequired && (
                        <div className="mt-4 ml-7">
                          <label htmlFor="expenseReceiptThreshold" className="block text-sm font-medium text-gray-700">
                            Receipt threshold
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="expenseReceiptThreshold"
                              id="expenseReceiptThreshold"
                              value={formData.expenseReceiptThreshold || ''}
                              onChange={handleNumberChange}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Only expenses above this amount require receipts. Leave empty to require receipts for all expenses.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Expense Tags */}
                    <div className="sm:col-span-6">
                      <label htmlFor="expenseTagOptions" className="block text-sm font-medium text-gray-700">
                        Expense Tags
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Define tags that can be applied to expenses for categorization.
                      </p>
                      
                      <div className="flex items-center mt-1">
                        <input
                          type="text"
                          name="newTag"
                          id="newTag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Add new tag"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add
                        </button>
                      </div>
                      
                      {formData.expenseTagOptions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.expenseTagOptions.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1.5 h-4 w-4 flex items-center justify-center text-blue-400 hover:text-blue-600 focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: General Settings */}
            {step === 3 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Configure default organization settings for currency, timezone, and tax.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Default Currency */}
                    <div className="sm:col-span-3">
                      <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700">
                        Default Currency
                      </label>
                      <div className="mt-1">
                        <select
                          id="defaultCurrency"
                          name="defaultCurrency"
                          value={formData.defaultCurrency}
                          onChange={handleChange}
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Primary currency for financial transactions.
                      </p>
                    </div>
                    
                    {/* Default Timezone */}
                    <div className="sm:col-span-3">
                      <label htmlFor="defaultTimezone" className="block text-sm font-medium text-gray-700">
                        Default Timezone
                      </label>
                      <div className="mt-1">
                        <select
                          id="defaultTimezone"
                          name="defaultTimezone"
                          value={formData.defaultTimezone}
                          onChange={handleChange}
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          {timezones.map((timezone) => (
                            <option key={timezone} value={timezone}>
                              {timezone}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Used for scheduling and reporting.
                      </p>
                    </div>
                    
                    {/* Default Tax Rate */}
                    <div className="sm:col-span-3">
                      <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-gray-700">
                        Default Tax Rate
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="defaultTaxRate"
                          id="defaultTaxRate"
                          value={formData.defaultTaxRate || ''}
                          onChange={handleNumberChange}
                          min="0"
                          max="1"
                          step="0.01"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            %
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Applied to transactions by default. Enter as decimal (e.g., 0.1 for 10%).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Inventory & Spatial Settings */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Inventory Settings */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Inventory Settings</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Configure how inventory is managed within your organization.
                    </p>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      {/* Inventory Policy */}
                      <div className="sm:col-span-3">
                        <label htmlFor="inventoryPolicy" className="block text-sm font-medium text-gray-700">
                          Inventory Policy
                        </label>
                        <div className="mt-1">
                          <select
                            id="inventoryPolicy"
                            name="inventoryPolicy"
                            value={formData.inventoryPolicy}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value={InventoryPolicy.FIFO}>FIFO (First In, First Out)</option>
                            <option value={InventoryPolicy.LIFO}>LIFO (Last In, First Out)</option>
                            <option value={InventoryPolicy.FEFO}>FEFO (First Expired, First Out)</option>
                            <option value={InventoryPolicy.NONE}>None</option>
                          </select>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Determines how inventory is consumed and managed.
                        </p>
                      </div>
                      
                      {/* Low Stock Threshold */}
                      <div className="sm:col-span-3">
                        <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
                          Low Stock Threshold
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="lowStockThreshold"
                            id="lowSt