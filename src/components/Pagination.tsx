import React from "react";

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
    <nav aria-label="Payment pagination">
      <ul className="pagination mb-0">
        <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>

        {startPage > 0 && (
          <>
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(0)}>
                1
              </button>
            </li>
            {startPage > 1 && (
              <li className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            )}
          </>
        )}

        {pages.map((pageNum) => (
          <li
            key={pageNum}
            className={`page-item ${pageNum === page ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum + 1}
            </button>
          </li>
        ))}

        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && (
              <li className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            )}
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(totalPages - 1)}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        <li
          className={`page-item ${
            page === totalPages - 1 ? "disabled" : ""
          }`}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages - 1}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;