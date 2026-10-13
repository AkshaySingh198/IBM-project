import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
}: DataTableProps<T>) {
  return (
    <div
      className="tessera-card"
      style={{
        overflowX: 'auto',
        backgroundColor: 'var(--surface)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--line)',
              backgroundColor: 'var(--surface-2)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--muted)',
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '0.875rem 1rem' }}>
                    <Skeleton height="1.125rem" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '2rem 1rem' }}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedKey === rowKey;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: isSelected ? 'var(--primary-soft)' : 'transparent',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--row-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '0.875rem 1rem',
                        color: 'var(--ink)',
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
