'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { TableWrap } from './ui';

/**
 * A small sortable, filterable table.
 *
 * Deliberately minimal: columns declare how to render and how to sort, and the whole
 * thing stays a real <table> so it reads correctly to a screen reader.
 */

export interface Column<T> {
  key: string;
  header: string;
  /** Cell contents. */
  render: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  caption,
  filterPlaceholder,
  filterOn,
  emptyMessage = 'Nothing to show.',
  rowKey,
  minWidth = '48rem',
}: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
  /** Show a text filter box driven by this accessor. */
  filterOn?: (row: T) => string;
  filterPlaceholder?: string;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  minWidth?: string;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let out = needle && filterOn ? rows.filter((r) => filterOn(r).toLowerCase().includes(needle)) : rows;

    const column = columns.find((c) => c.key === sortKey);
    if (column?.sortValue) {
      out = [...out].sort((a, b) => {
        const av = column.sortValue!(a);
        const bv = column.sortValue!(b);
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        return direction === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, query, filterOn, columns, sortKey, direction]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection('asc');
    }
  };

  return (
    <div>
      {filterOn ? (
        <div className="mb-3 max-w-sm">
          <label className="sr-only" htmlFor={`filter-${caption.replace(/\W+/g, '-')}`}>
            Filter {caption}
          </label>
          <input
            id={`filter-${caption.replace(/\W+/g, '-')}`}
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={filterPlaceholder ?? 'Filter…'}
          />
        </div>
      ) : null}

      <TableWrap minWidth={minWidth}>
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((column) => {
                const active = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    // aria-sort belongs on the header cell, not on the button inside it.
                    aria-sort={
                      column.sortValue
                        ? active
                          ? direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    className={`py-2 pr-3 font-medium ${column.className ?? ''}`}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-slate-ink"
                      >
                        {column.header}
                        {active ? (
                          direction === 'asc' ? (
                            <ArrowUp aria-hidden="true" className="h-3 w-3" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown aria-hidden="true" className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)} className="border-b border-hairline/70 align-top">
                {columns.map((column) => (
                  <td key={column.key} className={`py-3 pr-3 ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
