import React, { useState } from 'react';
import { useApi } from '../hooks/useApi'; // Adjust path to your custom hook
import { Table } from '../components/Table';
import {  ExtraDto, ExtraType, ExtraStatus } from '../types'; // Adjust imports
import { extrasApi } from '../services/api';

const ExtrasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExtraType>(ExtraType.SURPLUS);
  const [page, setPage] = useState(0);

  // useApi hook fetches data whenever activeTab changes
  const { data, loading, error } = useApi(() => 
    extrasApi.getExtras(page, 10, activeTab)
  );

  // Extract the list from your custom Response wrapper
  const extrasList = data?.data || [];

  const columns = [
    {
      key: 'memberName',
      header: 'Member Name',
      render: (item: ExtraDto) => <span className="font-medium">{item.memberName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: ExtraDto) => (
        <span className={activeTab === ExtraType.ARREAR ? 'text-red-600' : 'text-green-600'}>
          KSh {item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'periodDate',
      header: 'Period',
      render: (item: ExtraDto) => new Date(item.periodDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    },
    {
      key: 'date',
      header: 'Recorded Date',
      render: (item: ExtraDto) => item.date.toString(),
    },
    // Conditionally include Status column only for Arrears
    ...(activeTab === ExtraType.ARREAR
      ? [
          {
            key: 'status',
            header: 'Status',
            render: (item: ExtraDto) => (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                item.status === ExtraStatus.ACTIVE 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {item.status}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Member Extras</h1>
        
        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab(ExtraType.SURPLUS)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === ExtraType.SURPLUS
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Surplus
          </button>
          <button
            onClick={() => setActiveTab(ExtraType.ARREAR)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === ExtraType.ARREAR
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Arrears
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Failed to load extras. Please try again.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading data...</div>
        ) : (
          <Table<ExtraDto>
            columns={columns}
            data={extrasList}
            onRowClick={(item) => console.log('Viewing extra details:', item.id)}
          />
        )}
      </div>
      
      {/* Basic Pagination Metadata info */}
      {data?.metaData && (
        <div className="text-sm text-gray-500 text-right">
          Total Records: {data.metaData.totalElements}
        </div>
      )}
    </div>
  );
};

export default ExtrasPage;