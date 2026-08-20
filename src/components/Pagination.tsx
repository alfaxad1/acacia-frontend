import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const pages: number[] = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center space-x-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {startPage > 0 && (
        <>
          <button
            onClick={() => onPageChange(0)}
            className="w-10 h-10 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            1
          </button>
          {startPage > 1 && (
            <div className="w-10 h-10 flex items-center justify-center text-gray-400">
              <MoreHorizontal size={20} />
            </div>
          )}
        </>
      )}

      {pages.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
            pageNum === page
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {pageNum + 1}
        </button>
      ))}

      {endPage < totalPages - 1 && (
        <>
          {endPage < totalPages - 2 && (
            <div className="w-10 h-10 flex items-center justify-center text-gray-400">
              <MoreHorizontal size={20} />
            </div>
          )}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="w-10 h-10 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
};

export default Pagination;