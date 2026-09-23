import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

/**
 * Column shape:
 *   { key, header, width?, align?, sortable?, render?(row, index),
 *     primary?, mobile? }
 *
 * `expandable(row)` returns the node rendered in a full-width sub-row
 * (used by the Sales bill list).
 *
 * ---------------------------------------------------------------- on a phone
 *
 * Below `md` the table stops being a table. A seven-column grid on a 375px
 * screen is a horizontal scrollbar, and a horizontal scrollbar inside a
 * vertically scrolling page is the single most reliably unusable pattern on
 * a touch device — you cannot swipe the row without the page moving, and the
 * columns that matter are off-screen anyway.
 *
 * Each row becomes a card instead: the first column is the heading, the rest
 * are label/value pairs, and the actions sit along the bottom. No caller has
 * to do anything — every existing table gets this — but two optional column
 * flags tune it:
 *
 *   `primary: true`  use this column as the card heading instead of the first
 *   `mobile: false`  leave this column out of the card entirely
 *
 * A column whose header is empty is treated as actions: it keeps its own row
 * at the foot of the card with no label, which is what an icon strip wants.
 */
export function DataTable({
  columns,
  rows = [],
  loading = false,
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  expandable,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
  emptyAction,
  className,
  dense = false,
  initialExpanded = [],
}) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [expanded, setExpanded] = useState(() => new Set(initialExpanded));

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const accessor = column?.sortValue ?? ((row) => row[sort.key]);
    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sort.dir === "asc" ? result : -result;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const toggleExpand = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const pad = dense ? "px-4 py-2.5" : "px-4 py-3.5";

  /* Which column titles the card, and which ones fill it. */
  const shown = columns.filter((column) => column.mobile !== false);
  const heading = shown.find((column) => column.primary) ?? shown[0];
  const isActions = (column) => !column.header;
  const body = shown.filter((column) => column !== heading && !isActions(column));
  const actions = shown.filter((column) => column !== heading && isActions(column));

  const cell = (column, row, index) =>
    column.render ? column.render(row, index) : row[column.key];

  if (loading) {
    return (
      <div className={cn("od-card overflow-hidden", className)}>
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("od-card overflow-hidden", className)}>
      {/* ------------------------------------------------------- phone cards */}
      <div className="md:hidden">
        {sorted.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((row, index) => {
              const key = rowKey(row, index);
              const isOpen = expanded.has(key);
              return (
                <li key={key}>
                  <div
                    role={onRowClick ? "button" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "flex flex-col gap-2.5 px-4 py-3.5",
                      onRowClick && "od-focus cursor-pointer transition active:bg-brand-50/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 text-[14px] font-bold text-ink">
                        {heading ? cell(heading, row, index) : null}
                      </div>
                      {expandable ? (
                        <button
                          type="button"
                          aria-label={isOpen ? "Collapse row" : "Expand row"}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpand(key);
                          }}
                          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100"
                        >
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                      ) : null}
                    </div>

                    {body.length ? (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                        {body.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <dt className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink-faint">
                              {column.header}
                            </dt>
                            <dd className="mt-0.5 min-w-0 text-[13px] text-ink">
                              {cell(column, row, index)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}

                    {actions.length ? (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {actions.map((column) => (
                          <Fragment key={column.key}>{cell(column, row, index)}</Fragment>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {expandable && isOpen ? (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4">
                      {expandable(row)}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ------------------------------------------------------ the table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              {expandable ? <th className="w-10" /> : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center"
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1.5 uppercase transition hover:text-ink"
                    >
                      {column.header}
                      {sort.key !== column.key ? (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
                      ) : sort.dir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5 text-brand-600" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-brand-600" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (expandable ? 1 : 0)}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="py-14"
                  />
                </td>
              </tr>
            ) : (
              sorted.map((row, index) => {
                const key = rowKey(row, index);
                const isOpen = expanded.has(key);
                return (
                  <Fragment key={key}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-t border-slate-100 transition-colors",
                        onRowClick && "cursor-pointer hover:bg-brand-50/40"
                      )}
                    >
                      {expandable ? (
                        <td className="pl-3">
                          <button
                            type="button"
                            aria-label={isOpen ? "Collapse row" : "Expand row"}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpand(key);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100 hover:text-ink"
                          >
                            <ChevronDown
                              className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                            />
                          </button>
                        </td>
                      ) : null}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            pad,
                            "align-middle text-ink",
                            column.align === "right" && "text-right",
                            column.align === "center" && "text-center",
                            column.className
                          )}
                        >
                          {column.render ? column.render(row, index) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {expandable && isOpen ? (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={columns.length + 1} className="px-4 py-0">
                          {expandable(row)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
