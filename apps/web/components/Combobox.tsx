"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Optional badge/code shown on the right (e.g. ISO currency code, country code) */
  hint?: string;
  /** Extra strings the user can type to find this option (e.g. "United States", "USA", "US") */
  search?: string[];
};

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Wrapper class — used by callers that share an input style */
  className?: string;
  /** Optional element rendered absolutely on the left (e.g. globe icon) */
  leftIcon?: React.ReactNode;
  /** Force the dropdown menu width — useful inside narrow flex cells */
  menuWidth?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  /** Hide the selected-item hint badge in the closed combobox */
  hideSelectedHint?: boolean;
};

/**
 * Lightweight type-to-find combobox. Reusable for country / currency / any
 * `{value,label}[]` list. Keeps a real selected value in `value`; the input
 * shows the label of the selected option, or whatever the user is typing
 * while filtering.
 *
 * Why not native `<select>`: native selects only support first-letter jump on
 * desktop and not at all on most mobile browsers. With a custom combobox we
 * get full substring search across hundreds of options.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  leftIcon,
  menuWidth,
  disabled,
  ariaLabel,
  id,
  hideSelectedHint = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value) || null;

  // Filtered + ranked: prefix-of-label > prefix-of-value/hint > contains
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const score = (o: ComboboxOption): number => {
      const label = o.label.toLowerCase();
      const value = o.value.toLowerCase();
      const hint = (o.hint ?? "").toLowerCase();
      const extras = (o.search ?? []).map(s => s.toLowerCase());

      if (label.startsWith(q)) return 0;
      if (value.startsWith(q)) return 1;
      if (hint.startsWith(q)) return 2;
      if (extras.some(e => e.startsWith(q))) return 3;
      if (label.includes(q)) return 4;
      if (value.includes(q) || hint.includes(q)) return 5;
      if (extras.some(e => e.includes(q))) return 6;
      return -1;
    };
    return options
      .map(o => ({ o, s: score(o) }))
      .filter(x => x.s !== -1)
      .sort((a, b) => a.s - b.s)
      .map(x => x.o);
  }, [options, query]);

  // Reset highlight when filter changes
  useEffect(() => { setActiveIdx(0); }, [query, open]);

  // Click-outside close
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  // Keep highlighted item in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const inputDisplay = open ? query : (selected?.label ?? "");

  const select = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx(i => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt) select(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10">{leftIcon}</span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        placeholder={placeholder}
        value={inputDisplay}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`${className} ${leftIcon ? "pl-10" : ""} pr-10 cursor-pointer`}
      />

      {/* Right-side icons: hint badge for selected, then clear, then chevron */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {selected?.hint && !open && !hideSelectedHint && (
          <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
            {selected.hint}
          </span>
        )}
        {selected && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            aria-label="Clear selection"
            className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className={`absolute left-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-zinc-200/80 bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)] ${menuWidth ?? "w-full"}`}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-slate-400">No matches</div>
          ) : (
            <ul className="py-1">
              {filtered.map((opt, idx) => {
                const isActive = idx === activeIdx;
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13px] transition-colors ${
                      isActive ? "bg-emerald-50 text-emerald-900" : "text-zinc-800"
                    } ${isSelected ? "font-semibold" : ""}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className={`shrink-0 font-mono text-[10px] ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                        {opt.hint}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
