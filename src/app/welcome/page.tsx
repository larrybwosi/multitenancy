'use client';

import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { PlusCircle, X, Edit2, RefreshCw, ArrowRight, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadSanityAsset } from '@/actions/uploads';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';

// --- TypeScript Interfaces ---
interface Category {
  id?: string; // Optional: If your backend assigns IDs
  name: string;
  description: string;
}

interface OrganizationState {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null; // Added for logo
  defaultCurrency: string;
  defaultTimezone: string;
  defaultTaxRate: number | string; // Allow string for input control
  inventoryPolicy: 'FIFO' | 'LIFO' | 'FEFO';
  lowStockThreshold: number | string; // Allow string for input control
  negativeStock: boolean;
}

// --- Component ---
const CreateOrganizationPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingCategories, setGeneratingCategories] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organization, setOrganization] = useState<OrganizationState>({
    name: '',
    slug: '',
    description: '',
    logoUrl: null,
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    defaultTaxRate: 0,
    inventoryPolicy: 'FEFO',
    lowStockThreshold: 10,
    negativeStock: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<Category>({ name: '', description: '' });
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number>(-1);
  const [apiError, setApiError] = useState<string | null>(null);


  const handleOrganizationChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setOrganization(prev => {
      const newState = {
        ...prev,
        [name]: isCheckbox ? checked : value
      };

      // Auto-generate slug from name, only if slug is empty or directly derived
      if (name === 'name' && (prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))) {
        newState.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      return newState;
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setApiError(null);
    try {
      //@ts-expect-error this is fine
      const imageUrl = await uploadSanityAsset(file,`${organization.slug}-logo`, 'image');
      setOrganization(prev => ({ ...prev, logoUrl: imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setApiError('Failed to upload logo. Please try again.');
      // Optionally remove the blob URL if it was set prematurely
      setOrganization(prev => ({ ...prev, logoUrl: null }));
    } finally {
      setUploadingLogo(false);
      // Reset file input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerateCategories = async () => {
    if (!organization.description) {
      setApiError("Please provide a business description to generate categories.");
      return;
    }

    setGeneratingCategories(true);
    setApiError(null);

    try {
      const response = await fetch('/api/generate-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: organization.description })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.categories || !Array.isArray(data.categories)) {
         throw new Error('Invalid response format from API.');
      }
      setCategories(data.categories);

      //eslint-disable-next-line 
    } catch (error: any) {
      console.error('Error generating categories:', error);
      setApiError(error.message || 'Failed to generate categories. Please try again or add them manually.');
      setCategories([]); // Clear categories on error
    } finally {
      setGeneratingCategories(false);
    }
  };

  const addCategory = () => {
    if (newCategory.name.trim() === '') return;
    setCategories(prev => [...prev, { ...newCategory, id: `temp-${Date.now()}` }]); // Add temporary ID for key prop
    setNewCategory({ name: '', description: '' });
    setIsAddingCategory(false);
  };

  const updateCategory = () => {
    if (editingCategoryIndex === -1 || newCategory.name.trim() === '') return;
    setCategories(prev => prev.map((cat, index) => index === editingCategoryIndex ? { ...newCategory, id: cat.id } : cat));
    setNewCategory({ name: '', description: '' });
    setEditingCategoryIndex(-1);
    setIsAddingCategory(false); // Close form after update
  };

  const startEditCategory = (index: number) => {
    setNewCategory({ ...categories[index] });
    setEditingCategoryIndex(index);
    setIsAddingCategory(true); // Open form for editing
  };

  const deleteCategory = (index: number) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
     if(editingCategoryIndex === index) { // If deleting the category currently being edited
       cancelEdit();
     }
  };

  const cancelEdit = () => {
    setIsAddingCategory(false);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', description: '' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    const finalOrganizationData = {
        ...organization,
        // Ensure numeric fields are numbers
        defaultTaxRate: parseFloat(String(organization.defaultTaxRate)) || 0,
        lowStockThreshold: parseInt(String(organization.lowStockThreshold), 10) || 0,
        categories: categories.map(({ id, ...rest }) => rest) // Remove temporary IDs before sending
    };

    console.log('Submitting Organization Data:', finalOrganizationData);

    try {
      // Replace with your actual API endpoint for creating the organization
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrganizationData)
      });

      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create organization (status ${response.status})`);
      }

      const result = await response.json();
      console.log('Organization created successfully:', result);
       alert('Organization created successfully!');
      // Redirect or update UI state upon success
      // e.g., router.push(`/organizations/${result.id}`);

      //eslint-disable-next-line
    } catch (error: any) {
      console.error('Error creating organization:', error);
      setApiError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Helper to render input fields consistently
  const renderInput = (id: keyof OrganizationState, label: string, type = 'text', required = false, placeholder = '', helpText = '', props = {}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        name={id}
        id={id}
        value={String(organization[id] ?? '')} // Ensure value is string
        onChange={handleOrganizationChange}
        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
        required={required}
        placeholder={placeholder}
        {...props}
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );

  const renderSelect = (id: keyof OrganizationState, label: string, options: { value: string, label: string }[], required = false, helpText = '') => (
      <div>
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500">*</span>}
        </Label>
        <Select
            name={id}
            value={organization[id] as string}
            onValueChange={handleOrganizationChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            required={required}
          >
            {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
        </Select>
        {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
   );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stone-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <span className="text-xl font-semibold text-gray-800">
                Dealio Setup
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Side */}
          <div className="lg:w-1/2 flex items-center justify-center">
            <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/image2.jpg"
                alt="Organization setup illustration"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center p-8">
                <div className="text-white text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Get Your Business Online
                  </h2>
                  <p className="text-xl mb-6">
                    Follow these simple steps to set up your organization and
                    start managing your inventory efficiently
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${step === 1 ? "bg-orange-500" : "bg-white bg-opacity-50"}`}
                    ></div>
                    <div
                      className={`w-4 h-4 rounded-full ${step === 2 ? "bg-orange-500" : "bg-white bg-opacity-50"}`}
                    ></div>
                    <div
                      className={`w-4 h-4 rounded-full ${step === 3 ? "bg-orange-500" : "bg-white bg-opacity-50"}`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:w-1/2">
            <div className="bg-white shadow-xl rounded-lg overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                  Create Your Organization
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Follow these steps to set up your business profile on Drongo.
                </p>
              </div>

              {/* Progress Steps - Mobile Only */}
              <div className="px-6 py-4 border-b border-gray-200 lg:hidden">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      1
                    </div>
                    <span className="ml-2 text-sm font-medium">Details</span>
                  </div>
                  <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                    <div
                      className={`h-0.5 bg-orange-600 ${step > 1 ? "w-full" : "w-0"}`}
                    ></div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium">Categories</span>
                  </div>
                  <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                    <div
                      className={`h-0.5 bg-orange-600 ${step > 2 ? "w-full" : "w-0"}`}
                    ></div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      3
                    </div>
                    <span className="ml-2 text-sm font-medium">Settings</span>
                  </div>
                </div>
              </div>

              {/* Form Steps Content */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-8">
                  {apiError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      <strong>Error:</strong> {apiError}
                    </div>
                  )}

                  {/* Step 1: Details */}
                  {step === 1 && (
                    <section className="space-y-6 animate-fadeIn">
                      <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Organization Details
                      </h2>
                      <div className="grid grid-cols-1 gap-6">
                        {/* Logo Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Logo (Optional)
                          </label>
                          <div className="mt-1 flex items-center gap-4">
                            <span className="inline-block h-16 w-16 rounded-lg overflow-hidden bg-gray-100 items-center justify-center border">
                              {organization.logoUrl ? (
                                <Image
                                  src={organization.logoUrl}
                                  width={100}
                                  height={100}
                                  alt="Organization Logo Preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              )}
                            </span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp, image/svg+xml"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              className="hidden"
                              id="logo-upload"
                              disabled={uploadingLogo}
                            />
                            <label
                              htmlFor="logo-upload"
                              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${uploadingLogo ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {uploadingLogo ? (
                                <>
                                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                                  {organization.logoUrl
                                    ? "Change Logo"
                                    : "Upload Logo"}
                                </>
                              )}
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Upload a logo (PNG, JPG, WEBP, SVG). Max 2MB
                            recommended.
                          </p>
                        </div>

                        {renderInput(
                          "name",
                          "Organization Name",
                          "text",
                          true,
                          "e.g., Acme Corporation"
                        )}
                        <div>
                          <label
                            htmlFor="slug"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            URL Slug<span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                              drongo.io/org/
                            </span>
                            <input
                              type="text"
                              name="slug"
                              id="slug"
                              value={organization.slug}
                              onChange={handleOrganizationChange}
                              className="flex-1 block w-full min-w-0 rounded-none rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                              required
                              placeholder="e.g., acme-corp"
                              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Unique URL identifier. Only lowercase letters,
                            numbers, and hyphens.
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Business Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={organization.description}
                            onChange={handleOrganizationChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            placeholder="Describe your business activities, products, or services."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Provide enough detail for accurate category
                            generation.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={nextStep}
                          disabled={!organization.name || !organization.slug}
                          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next: Categories
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Step 2: Categories */}
                  {step === 2 && (
                    <section className="space-y-6 animate-fadeIn">
                      <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Business Categories
                      </h2>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800 flex-1">
                          Categories help organize products, services, and
                          reporting.
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateCategories}
                          disabled={
                            !organization.description || generatingCategories
                          }
                          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingCategories ? (
                            <>
                              <Loader2 className="animate-spin mr-2 h-4 w-4" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Generate with AI
                            </>
                          )}
                        </button>
                      </div>

                      {/* Categories List */}
                      <div className="space-y-3">
                        {categories.length > 0 ? (
                          categories.map((category, index) => (
                            <div
                              key={category.id || index}
                              className="flex items-start justify-between p-3 border border-gray-200 rounded-md bg-white hover:shadow-sm transition-shadow duration-150"
                            >
                              <div className="flex-1 mr-4">
                                <h4 className="text-sm font-semibold text-gray-800">
                                  {category.name}
                                </h4>
                                {category.description && (
                                  <p className="mt-1 text-xs text-gray-600">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-shrink-0 space-x-1">
                                <button
                                  type="button"
                                  onClick={() => startEditCategory(index)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCategory(index)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-sm text-gray-500 border border-dashed rounded-md">
                            {generatingCategories ? (
                              <div className="flex justify-center items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />{" "}
                                Generating categories...
                              </div>
                            ) : organization.description ? (
                              <p>
                                No categories yet. Click &quot;Generate with
                                AI&quot; or &quot;Add Custom Category&quot;
                                below.
                              </p>
                            ) : (
                              <p>
                                Add a business description in Step 1 to generate
                                categories, or add them manually.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Add/Edit Category Form */}
                      {isAddingCategory ? (
                        <div className="border border-orange-300 bg-orange-50 rounded-md p-4 transition-all duration-300 ease-out">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            {editingCategoryIndex >= 0
                              ? "Edit Category"
                              : "Add New Category"}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label
                                htmlFor="categoryName"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Category Name
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="categoryName"
                                value={newCategory.name}
                                onChange={(e) =>
                                  setNewCategory({
                                    ...newCategory,
                                    name: e.target.value,
                                  })
                                }
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                required
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="categoryDescription"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Description (Optional)
                              </label>
                              <input
                                type="text"
                                id="categoryDescription"
                                value={newCategory.description}
                                onChange={(e) =>
                                  setNewCategory({
                                    ...newCategory,
                                    description: e.target.value,
                                  })
                                }
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                placeholder="A short description of the category"
                              />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={
                                  editingCategoryIndex >= 0
                                    ? updateCategory
                                    : addCategory
                                }
                                disabled={!newCategory.name}
                                className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                              >
                                {editingCategoryIndex >= 0
                                  ? "Update Category"
                                  : "Add Category"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(true)}
                          className="inline-flex items-center px-4 py-2 border border-dashed border-gray-400 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <PlusCircle className="mr-2 h-4 w-4 text-gray-500" />
                          Add Custom Category
                        </button>
                      )}

                      <div className="flex justify-between pt-6 border-t mt-6">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={nextStep}
                          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Next: Settings
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Step 3: Settings */}
                  {step === 3 && (
                    <section className="space-y-6 animate-fadeIn">
                      <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Business Settings
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Configure default operational settings for your
                        organization. These can be changed later.
                      </p>

                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        {renderSelect(
                          "defaultCurrency",
                          "Default Currency",
                          [
                            { value: "USD", label: "USD - US Dollar" },
                            { value: "EUR", label: "EUR - Euro" },
                            { value: "GBP", label: "GBP - British Pound" },
                            { value: "KES", label: "KES - Kenyan Shilling" },
                            { value: "NGN", label: "NGN - Nigerian Naira" },
                            { value: "ZAR", label: "ZAR - South African Rand" },
                          ],
                          true,
                          "Primary currency for transactions and reporting."
                        )}

                        {renderSelect(
                          "defaultTimezone",
                          "Default Timezone",
                          [
                            {
                              value: "UTC",
                              label: "UTC - Coordinated Universal Time",
                            },
                            {
                              value: "America/New_York",
                              label: "America/New_York (EST/EDT)",
                            },
                            {
                              value: "Europe/London",
                              label: "Europe/London (GMT/BST)",
                            },
                            {
                              value: "Europe/Berlin",
                              label: "Europe/Berlin (CET/CEST)",
                            },
                            {
                              value: "Africa/Nairobi",
                              label: "Africa/Nairobi (EAT)",
                            },
                            {
                              value: "Africa/Lagos",
                              label: "Africa/Lagos (WAT)",
                            },
                            {
                              value: "Africa/Johannesburg",
                              label: "Africa/Johannesburg (SAST)",
                            },
                          ],
                          true,
                          "Timezone for date/time recording."
                        )}

                        {renderInput(
                          "defaultTaxRate",
                          "Default Tax Rate (%)",
                          "number",
                          false,
                          "e.g., 16",
                          "Default sales tax percentage (0 if none).",
                          { step: "0.01", min: "0", max: "100" }
                        )}

                        {renderSelect(
                          "inventoryPolicy",
                          "Inventory Policy",
                          [
                            {
                              value: "FIFO",
                              label: "FIFO - First In, First Out",
                            },
                            {
                              value: "LIFO",
                              label: "LIFO - Last In, First Out",
                            },
                            {
                              value: "FEFO",
                              label: "FEFO - First Expired, First Out",
                            },
                          ],
                          false,
                          "Method for valuing inventory cost."
                        )}

                        {renderInput(
                          "lowStockThreshold",
                          "Low Stock Threshold",
                          "number",
                          false,
                          "10",
                          "Receive alerts when stock quantity falls below this number.",
                          { min: "0" }
                        )}

                        <div className="sm:col-span-2">
                          <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="negativeStock"
                                name="negativeStock"
                                type="checkbox"
                                checked={organization.negativeStock}
                                onChange={handleOrganizationChange}
                                className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="negativeStock"
                                className="font-medium text-gray-700"
                              >
                                Allow Negative Stock
                              </label>
                              <p className="text-xs text-gray-500">
                                Enable selling products even when inventory
                                count is zero or below.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-6 border-t mt-6">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                              Creating Organization...
                            </>
                          ) : (
                            "Create Organization"
                          )}
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent mt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Drongo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CreateOrganizationPage;