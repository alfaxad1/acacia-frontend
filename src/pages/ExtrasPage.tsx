import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Table } from '../components/Table';
import { ExtraDto, ExtraType, ExtraStatus } from '../types';
import { extrasApi } from '../services/api';
import { ChevronRight, X, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const ExtrasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExtraType>(ExtraType.SURPLUS);
  const [page, setPage] = useState(0);
  const [selectedExtra, setSelectedExtra] = useState<ExtraDto | null>(null);

  const { data, loading, error, refetch } = useApi(() => 
    extrasApi.getExtras(page, 10, activeTab)
  );

  const extrasList = data?.data || [];
  const totalRecords = data?.metaData?.totalElements || 0;

  const handleTabChange = (tab: ExtraType) => {
    setActiveTab(tab);
    setPage(0); // Reset to first page when changing tabs
  };

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
        <span className={activeTab === ExtraType.ARREAR ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
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
      render: (item: ExtraDto) => new Date(item.date).toLocaleDateString(),
    },
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

  // Calculate totals
  const totalAmount = extrasList.reduce((sum, item) => sum + item.amount, 0);

  if (loading && extrasList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading extras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Member Extras</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Track member surpluses and arrears
        </p>
      </div>

      {/* Tab Toggle - Mobile Optimized */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => handleTabChange(ExtraType.SURPLUS)}
          className={`flex-1 py-3 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === ExtraType.SURPLUS
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <TrendingUp size={16} className={activeTab === ExtraType.SURPLUS ? 'text-blue-600' : 'text-gray-400'} />
            <span>Surplus</span>
          </div>
        </button>
        <button
          onClick={() => handleTabChange(ExtraType.ARREAR)}
          className={`flex-1 py-3 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === ExtraType.ARREAR
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <TrendingDown size={16} className={activeTab === ExtraType.ARREAR ? 'text-red-600' : 'text-gray-400'} />
            <span>Arrears</span>
          </div>
        </button>
      </div>

      {/* Summary Cards - Mobile View */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`bg-white p-3 rounded-xl border ${
          activeTab === ExtraType.SURPLUS ? 'border-blue-100' : 'border-red-100'
        } shadow-sm`}>
          <p className="text-xs text-gray-500 mb-1">Total {activeTab}</p>
          <p className={`text-lg font-bold ${
            activeTab === ExtraType.SURPLUS ? 'text-blue-600' : 'text-red-600'
          }`}>
            KSh {totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Records</p>
          <p className="text-lg font-bold text-gray-900">{extrasList.length}</p>
        </div>
      </div>

      {/* Mobile View: Card Layout */}
      <div className="block md:hidden space-y-3">
        {extrasList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            onClick={() => setSelectedExtra(item)}
          >
            <div className="p-4">
              {/* Header with Member Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                    activeTab === ExtraType.SURPLUS 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {item.memberName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.memberName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(item.periodDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>

              {/* Amount */}
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className={`text-lg font-bold ${
                  activeTab === ExtraType.SURPLUS ? 'text-blue-600' : 'text-red-600'
                }`}>
                  KSh {item.amount.toLocaleString()}
                </p>
              </div>

              {/* Date and Status */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar size={12} />
                  <span>Recorded: {new Date(item.date).toLocaleDateString()}</span>
                </div>
                {activeTab === ExtraType.ARREAR && item.status && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    item.status === ExtraStatus.ACTIVE 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {extrasList.length === 0 && !loading && (
          <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              activeTab === ExtraType.SURPLUS ? 'bg-blue-50' : 'bg-red-50'
            }`}>
              {activeTab === ExtraType.SURPLUS ? (
                <TrendingUp size={24} className="text-blue-400" />
              ) : (
                <TrendingDown size={24} className="text-red-400" />
              )}
            </div>
            <p className="text-gray-400">No {activeTab.toLowerCase()} records found</p>
          </div>
        )}

        {/* Loading More Indicator */}
        {loading && extrasList.length > 0 && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table<ExtraDto>
            columns={columns}
            data={extrasList}
            onRowClick={(item) => console.log('Viewing extra details:', item.id)}
          />
        </div>
      </div>

      {/* Pagination Info */}
      {data?.metaData && (
        <div className="mt-4 text-xs md:text-sm text-gray-500 text-right">
          Total Records: {totalRecords}
          {data.metaData.totalPages > 1 && (
            <span className="ml-2">
              | Page {page + 1} of {data.metaData.totalPages}
            </span>
          )}
        </div>
      )}

      {/* Mobile Details Modal */}
      {selectedExtra && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
          onClick={() => setSelectedExtra(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Extra Details</h3>
              <button
                onClick={() => setSelectedExtra(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Member Info */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${
                  activeTab === ExtraType.SURPLUS 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  {selectedExtra.memberName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedExtra.memberName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === ExtraType.SURPLUS ? 'Surplus' : 'Arrear'}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className={`p-4 rounded-xl ${
                activeTab === ExtraType.SURPLUS ? 'bg-blue-50' : 'bg-red-50'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className={`text-2xl font-bold ${
                  activeTab === ExtraType.SURPLUS ? 'text-blue-600' : 'text-red-600'
                }`}>
                  KSh {selectedExtra.amount.toLocaleString()}
                </p>
              </div>

              {/* Details Grid */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <DetailRow 
                  label="Period" 
                  value={new Date(selectedExtra.periodDate).toLocaleDateString('en-GB', { 
                    month: 'long', 
                    year: 'numeric' 
                  })} 
                />
                <DetailRow 
                  label="Recorded Date" 
                  value={new Date(selectedExtra.date).toLocaleDateString()} 
                />
                {activeTab === ExtraType.ARREAR && selectedExtra.status && (
                  <DetailRow 
                    label="Status" 
                    value={
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        selectedExtra.status === ExtraStatus.ACTIVE 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedExtra.status}
                      </span>
                    } 
                  />
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">Reference ID</p>
                <p className="text-xs font-mono text-gray-700 break-all">{selectedExtra.id}</p>
              </div>

              <button
                onClick={() => setSelectedExtra(null)}
                className="w-full py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 bg-red-50 text-red-600 rounded-lg shadow-lg border border-red-200 z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Failed to load extras.</span>
            <button
              onClick={() => refetch()}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default ExtrasPage;