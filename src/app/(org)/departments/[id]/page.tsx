'use client'
import React, { use } from 'react';
import { Users, Wallet, FileSpreadsheet, Info, Calendar, User } from 'lucide-react';
import Image from 'next/image';
import { useGetFullDepartment } from '@/lib/hooks/use-departments';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (used: number, total: number) => {
  return Math.round((used / total) * 100);
};


type Params = Promise<{ id: string }>
const DepartmentDetailsCard = (props: { params: Params; }) => {
  const params = use(props.params);
  const { data: department, isLoading: loading, error } = useGetFullDepartment(params.id);
  console.log(department)
  if (loading) {
    return;
  }
  if (error || !department) {
    return;
  }
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      {/* Banner and Department Header */}
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl overflow-hidden">
        {department.banner ? (
          <Image
            src={department.banner}
            alt={`${department.name} banner`}
            fill
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30 flex items-end p-6">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-xl bg-white shadow-lg overflow-hidden flex items-center justify-center">
              {department.image ? (
                <Image src={department.image} alt={department.name} fill className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
                  <Info size={32} />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{department.name}</h1>
              <p className="text-white/80 mt-1">Updated {formatDate(department.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-md rounded-b-xl p-6">
        {/* Description */}
        {department.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
            <p className="text-gray-600">{department.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Department Head & Members */}
          <div className="lg:col-span-1 space-y-6">
            {/* Department Head */}
            {department.head && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="mr-2 text-blue-500" size={20} />
                  Department Head
                </h2>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    {department.head.userName ? department.head.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{department.head.userName || 'Unnamed User'}</h3>
                    <p className="text-sm text-gray-500">{department.head.role}</p>
                    <p className="text-xs text-gray-400">{department.head.userEmail}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Department Members */}
            <div className="bg-gray-50 rounded-xl p-4 h-96 overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2 text-blue-500" size={20} />
                Team Members ({department.members.length})
              </h2>
              <div className="space-y-4">
                {department.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                      {member.userName ? member.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{member.userName || 'Unnamed User'}</h3>
                      <p className="text-sm text-gray-500 truncate">{member.role}</p>
                      <div className="flex gap-1 mt-1">
                        {member.canApproveExpenses && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Approver</span>
                        )}
                        {member.canManageBudget && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Budget</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle & Right Columns: Budgets and Workflows */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Budget */}
            {department.activeBudget && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Wallet className="mr-2 text-blue-500" size={20} />
                  Active Budget
                </h2>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-800 text-lg">{department.activeBudget.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(department.activeBudget.periodStart)} -{' '}
                        {formatDate(department.activeBudget.periodEnd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">
                        {formatCurrency(department.activeBudget.amountRemaining)}
                      </p>
                      <p className="text-sm text-gray-500">
                        remaining of {formatCurrency(department.activeBudget.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${formatPercentage(department.activeBudget.amountUsed, department.activeBudget.amount)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>
                      {formatPercentage(department.activeBudget.amountUsed, department.activeBudget.amount)}% used
                    </span>
                    <span>{formatCurrency(department.activeBudget.amountUsed)} spent</span>
                  </div>
                </div>
              </div>
            )}

            {/* All Budgets */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-500" size={20} />
                Budget History
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {department.budgets.map(budget => (
                      <tr key={budget.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{budget.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(budget.amount)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(budget.periodStart)} - {formatDate(budget.periodEnd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workflows */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileSpreadsheet className="mr-2 text-blue-500" size={20} />
                Workflows
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {department.workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800">{workflow.name}</h3>
                      {workflow.description && <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>}
                    </div>
                    <div className="flex flex-col items-end">
                      {workflow.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span>
                      )}
                      {workflow.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">Default</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsCard;
