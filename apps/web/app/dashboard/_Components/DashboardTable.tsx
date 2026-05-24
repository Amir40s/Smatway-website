import React from "react";

// ─── Ant Design–style empty inbox SVG ─────────────────────────────────────────

function AntEmptyInbox() {
  return (
    <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
      <title>No data</title>
      <g transform="translate(0 1)" fill="none" fillRule="evenodd">
        <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7" />
        <g fillRule="nonzero" stroke="#d9d9d9">
          <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
          <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#fafafa" />
        </g>
      </g>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableColumn =
  | string
  | { label: string; align?: "left" | "center" | "right" };

interface DashboardTableProps {
  /** Column definitions — plain string defaults to left-aligned */
  columns: TableColumn[];
  /** Optional card header title */
  title?: string;
  /** Optional element rendered on the right side of the card header */
  action?: React.ReactNode;
  /** Table body rows — omit (or pass nothing) to show the empty state */
  children?: React.ReactNode;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardTable({
  columns,
  title,
  action,
  children,
}: DashboardTableProps) {
  const colCount = columns.length;

  return (
    <div className="bg-white rounded-lg border border-[#f0f0f0] overflow-hidden">
      {/* Card header — only rendered when a title is provided */}
      {title && (
        <div
          className="px-6 flex items-center justify-between"
          style={{ minHeight: 56, borderBottom: "1px solid #f0f0f0" }}
        >
          <span className="text-base font-semibold text-slate-900">{title}</span>
          {action}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ width: "max-content", minWidth: "100%" }}
        >
          <thead>
            <tr>
              {columns.map((col, i) => {
                const label = typeof col === "string" ? col : col.label;
                const align = typeof col === "string" ? "left" : (col.align ?? "left");
                return (
                  <th
                    key={i}
                    className={`px-4 py-3 font-semibold text-slate-900 whitespace-nowrap bg-[#fafafa] border-b border-[#f0f0f0] ${alignClass[align]}`}
                  >
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {children ?? (
              <tr>
                <td colSpan={colCount}>
                  <div
                    className="flex flex-col items-center justify-center py-8"
                    style={{ color: "rgba(0,0,0,0.25)" }}
                  >
                    <AntEmptyInbox />
                    <p className="text-sm mt-2">No data</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
