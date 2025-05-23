'use client';
import { ExportAction, FilterControls, FilterOption } from '@/components/file-controls';
import { Pagination } from '@/components/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

// --- Mock Data and Filter Options (unchanged) ---
interface StaffMember {
  id: string;
  staffId: string;
  avatar: string;
  name: string;
  position: string;
  date: string;
  checkIn: string;
  checkOut: string;
  stayTime: string;
  status: 'Check Out' | 'Working On' | 'On Vacation';
}const mockStaffData: StaffMember[] = [
  // Add data matching the structure in the image...
  { id: '1', staffId: '#60123088', avatar: '/path/to/avatar1.png', name: 'Anderson Dark', position: 'General Manager', date: '24 July 2024', checkIn: '10:00 AM', checkOut: '06:00 PM', stayTime: '08 Hours', status: 'Check Out' },
  { id: '2', staffId: '#60123066', avatar: '/path/to/avatar2.png', name: 'White Elefant', position: 'Room Cleaner', date: '22 July 2024', checkIn: '02:00 PM', checkOut: '-------', stayTime: '03 Hours', status: 'Working On' },
  { id: '3', staffId: '#60123056', avatar: '/path/to/avatar3.png', name: 'Mark Garson', position: 'Fron Desk', date: '21 March 2022', checkIn: '02:00 PM', checkOut: '10:00 PM', stayTime: '08 Hours', status: 'Check Out' },
  { id: '4', staffId: '#60123041', avatar: '/path/to/avatar4.png', name: 'Sugar Soll', position: 'Designer', date: '20 July 2024', checkIn: '03:00 PM', checkOut: '-------', stayTime: '06 Hours', status: 'Working On' },
  { id: '5', staffId: '#60123040', avatar: '/path/to/avatar5.png', name: 'Criss Brak', position: 'Marketing Manager', date: '17 July 2024', checkIn: '02:00 PM', checkOut: '-------', stayTime: '02 Hours', status: 'Working On' },
  { id: '6', staffId: '#60123030', avatar: '/path/to/avatar6.png', name: 'Lionel Messi', position: 'Cleaner Staff', date: '16 July 2024', checkIn: '02:00 PM', checkOut: '10:00 PM', stayTime: '03 Hours', status: 'Check Out' },
  { id: '7', staffId: '#60123028', avatar: '/path/to/avatar7.png', name: 'Ronaldo Praso', position: 'Room Cleaner', date: '15 July 2024', checkIn: '-------', checkOut: '-------', stayTime: '-------', status: 'On Vacation' },
  { id: '8', staffId: '#60123026', avatar: '/path/to/avatar8.png', name: 'Benzema Cor', position: 'Room Cleaner', date: '14 July 2024', checkIn: '02:00 PM', checkOut: '06:00 PM', stayTime: '03 Hours', status: 'Check Out' },
  { id: '9', staffId: '#60123024', avatar: '/path/to/avatar9.png', name: 'Mesol Mark', position: 'Office Manager', date: '12 July 2024', checkIn: '10:00 AM', checkOut: '-------', stayTime: '05 Hours', status: 'Working On' },
  { id: '10', staffId: '#60123023', avatar: '/path/to/avatar10.png', name: 'Muhammad M', position: 'Room Cleaner', date: '11 July 2024', checkIn: '12:00 AM', checkOut: '-------', stayTime: '03 Hours', status: 'Working On' },
];

const staffFilterOptions: FilterOption[] = [{ value: 'all', label: 'All Staff' } /*...*/];
const statusFilterOptions: FilterOption[] = [
  { value: 'all', label: 'Status' },
  { value: 'check_out', label: 'Check Out' },
  { value: 'working_on', label: 'Working On' },
  { value: 'on_vacation', label: 'On Vacation' },
];
const dateFilterOptions: FilterOption[] = [{ value: 'today', label: 'Today' } /*...*/];

// --- Component ---
const StaffAttendancePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ staff: 'all', status: 'all', date: 'today', search: '' });

  // Memoized Callbacks
  const handleSearch = useCallback(
    debounce((value: string) => {
      console.log('Search:', value);
      setFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleFilterChange = useCallback((name: string, value: string) => {
    console.log(`Filter ${name} changed to:`, value);
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const handleFilterButtonClick = useCallback(() => {
    console.log('Filter button clicked');
  }, []);

  const handleExportPDF = useCallback(() => {
    console.log('Export PDF clicked');
  }, []);

  const handleExportExcel = useCallback(() => {
    console.log('Export Excel clicked');
  }, []);

  const handlePageChange = useCallback((page: number) => {
    console.log('Page changed to:', page);
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    console.log('Page size changed to:', size);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Memoized Data Computations
  const filteredData = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return mockStaffData.filter(
      item =>
        (filters.status === 'all' || item.status.toLowerCase().replace(' ', '_') === filters.status) &&
        (item.name.toLowerCase().includes(searchLower) ||
          item.staffId.toLowerCase().includes(searchLower) ||
          item.position.toLowerCase().includes(searchLower))
    );
  }, [filters.status, filters.search]);

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Memoized Export Actions
  const exportActions: ExportAction[] = useMemo(
    () => [
      { label: 'Export PDF', onClick: handleExportPDF, icon: <Download /> },
      { label: 'Export Excel', onClick: handleExportExcel, icon: <Download /> },
    ],
    [handleExportPDF, handleExportExcel]
  );

  // Memoized Status Badge Class
  const getStatusBadgeClass = useCallback((status: StaffMember['status']): string => {
    switch (status) {
      case 'Working On':
        return 'bg-blue-100 text-blue-700';
      case 'Check Out':
        return 'bg-gray-200 text-gray-700';
      case 'On Vacation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <span className="inline-block p-3 mr-4 bg-gray-200 rounded-lg">Icon</span>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Staff Attendance</h1>
          <span className="text-sm text-gray-500">Auto-updates in 2 min</span>
        </div>
      </div>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
        <FilterControls
          showSearch={true}
          searchPlaceholder="Search..."
          onSearch={handleSearch}
          showFilterButton={true}
          onFilterButtonClick={handleFilterButtonClick}
          filters={[
            {
              name: 'staff',
              label: 'Staff Filter',
              options: staffFilterOptions,
              defaultValue: 'all',
              onChange: value => handleFilterChange('staff', value),
            },
            {
              name: 'status',
              label: 'Status Filter',
              options: statusFilterOptions,
              defaultValue: 'all',
              onChange: value => handleFilterChange('status', value),
            },
            {
              name: 'date',
              label: 'Date Filter',
              options: dateFilterOptions,
              defaultValue: 'today',
              onChange: value => handleFilterChange('date', value),
            },
          ]}
          exportActions={exportActions}
          variant="default"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th scope="col" className="p-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Staff ID
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap" colSpan={2}>
                Staff Name
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Position
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Date
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Check In
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Check Out
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Stay Time
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map(staff => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="w-4 p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{staff.staffId}</td>
                <td className="px-4 py-2 whitespace-nowrap" colSpan={2}>
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarImage src={staff.avatar || 'https://via.placeholder.com/40'} alt={staff.name} />
                      <AvatarFallback>{staff.name}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{staff.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{staff.position}</td>
                <td className="px-4 py-3 whitespace-nowrap">{staff.date}</td>
                <td className="px-4 py-3 whitespace-nowrap">{staff.checkIn}</td>
                <td className="px-4 py-3 whitespace-nowrap">{staff.checkOut}</td>
                <td className="px-4 py-3 whitespace-nowrap">{staff.stayTime}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(staff.status)}`}
                  >
                    {staff.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button className="text-gray-500 hover:text-gray-700">...</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && <div className="p-4 text-center text-gray-500">No staff data found.</div>}
      </div>

      <div className="mt-4 bg-white p-4 rounded-lg shadow-sm flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
};

export default StaffAttendancePage;
