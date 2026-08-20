import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

/**
 * Table on tablet and up; the same rows collapse into stacked label/value
 * cards on phones so nothing needs horizontal scrolling.
 */
export function Table<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Nothing here yet',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : 'hover:bg-gray-50/60'
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap px-5 py-4 text-sm text-gray-800"
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 md:hidden">
        {data.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onRowClick?.(item)}
            className="block w-full space-y-2 px-4 py-4 text-left active:bg-brand-50/60"
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-3"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {column.header}
                </span>
                <span className="min-w-0 break-words text-sm text-gray-800">
                  {column.render(item)}
                </span>
              </div>
            ))}
          </button>
        ))}
      </div>
    </>
  );
}
