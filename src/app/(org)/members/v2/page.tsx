'use client'
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MotionDiv, MotionTr } from '@/components/motion';
import UserCreationModal from '../components/add-modal';
import { useQueryState } from 'nuqs';
import { useMembers } from '@/lib/hooks/use-org';
import { formatDate } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Mock data for departments
const departments = [
  'Marketing / Sales',
  'Information Technology',
  'Finance / Accounting',
  'Financial Management',
  'Human Resource',
  'Customer Service',
];



// Main component
const DepartmentManagementSystem = () => {
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useQueryState('modal', {
    parse: v => v === 'true',
    serialize: v => (v ? 'true' : 'false'),
  });
  
  const { data: members, isLoading, error } = useMembers();

  if(isLoading) return
  if(error || !members) return
  // Filter members based on search and filter criteria
  const filteredMembers = members?.filter(employee => {
    return (
      (searchName === '' || employee.name.toLowerCase().includes(searchName.toLowerCase())) &&
      (searchEmail === '' || employee.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
      (filterDepartment === '' || employee.department?.name === filterDepartment) &&
      (filterStatus === true || employee.isActive === filterStatus)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchName('');
    setSearchEmail('');
    setFilterDepartment('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <SectionHeader
          title="Organization Members"
          subtitle="Manage your organization's team members and their roles"
          icon={<Users className="h-8 w-8 text-yellow-500" />}
        />
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => {}}>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export to Files
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              type="text"
              placeholder="Type name..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="text"
              placeholder="Type email..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creation Date</label>
            <Input type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>All</SelectLabel>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>All</SelectLabel>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800 text-white">
                <TableHead className="w-10 text-white">#</TableHead>
                <TableHead className="text-white">Employee Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Creation Date</TableHead>
                <TableHead className="text-white">Main Department</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-right text-white">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {paginatedMembers.map((employee, index) => (
                  <MotionTr
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {employee.image ? (
                          <Image src={employee.image} fill alt={employee.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{employee.name.charAt(0)}</span>
                        )}
                      </div>
                      <span>{employee.name}</span>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{formatDate(employee.createdAt)}</TableCell>
                    <TableCell>{employee.department?.name || 'Not Assigned'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.isActive ? 'Active' : 'In Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </MotionTr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={value => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">
              View 1 - {Math.min(rowsPerPage, filteredMembers.length)} of {filteredMembers.length} total
            </span>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum}>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
      <UserCreationModal isOpen={isModalOpen as boolean} onOpenChange={() => setIsModalOpen(false)} />
    </MotionDiv>
  );
};

export default DepartmentManagementSystem;
