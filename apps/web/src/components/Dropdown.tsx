import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { IconChevron } from './icons';

export interface Option<V extends string> {
  value: V;
  label: string;
}

export function Dropdown<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: Option<V>[];
  onChange: (v: V) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const current = options.find((o) => o.value === value) ?? options[0];

  const openList = () => {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const pick = (v: V) => {
    onChange(v);
    close();
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (open)
      list.current
        ?.querySelector(`[data-i="${active}"]`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      setActive(Math.max(0, Math.min(last, i)));
    };
    switch (e.key) {
      case 'ArrowDown':
        return move(active + 1);
      case 'ArrowUp':
        return move(active - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
      case 'Enter':
      case ' ':
        e.preventDefault();
        return pick(options[active].value);
      case 'Escape':
        e.preventDefault();
        return close();
      case 'Tab':
        return close(false);
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const now = Date.now();
          typed.current.text =
            (now - typed.current.at < 600 ? typed.current.text : '') +
            e.key.toLowerCase();
          typed.current.at = now;
          const hit = options.findIndex((o) =>
            o.label.toLowerCase().startsWith(typed.current.text),
          );
          if (hit >= 0) setActive(hit);
        }
    }
  };

  return (
    <div
      ref={root}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <span
        id={`${id}-l`}
        style={{ fontSize: 13, fontWeight: 500, color: 'var(--label)' }}
      >
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openList();
          }
        }}
        style={{
          width: '100%',
          height: 46,
          padding: '0 14px 0 16px',
          borderRadius: 16,
          border: `1px solid rgba(190,227,201,${open ? 0.45 : 0.2})`,
          background: open ? 'rgba(190,227,201,0.08)' : '#0B1711',
          color: 'var(--text)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color .25s, background .25s',
        }}
      >
        <span id={`${id}-v`}>{current.label}</span>
        <IconChevron
          dir="down"
          size={14}
          style={{
            flex: 'none',
            color: 'var(--mint)',
            transition: 'transform .45s var(--ios)',
            transform: `rotate(${open ? 180 : 0}deg)`,
          }}
        />
      </button>
      {open && (
        <div
          ref={list}
          className="wm-ddin"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-l`}
          aria-activedescendant={`${id}-o${active}`}
          onKeyDown={onListKey}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 6,
            marginTop: 2,
            borderRadius: 18,
            background: 'rgba(11,23,17,0.92)',
            border: '1px solid rgba(190,227,201,0.18)',
            boxShadow:
              '0 18px 40px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            maxHeight: 300,
            overflowY: 'auto',
            outline: 'none',
          }}
        >
          {options.map((o, i) => {
            const sel = o.value === value;
            return (
              <div
                key={o.value}
                id={`${id}-o${i}`}
                data-i={i}
                role="option"
                aria-selected={sel}
                data-active={i === active}
                className="wm-opt"
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  minHeight: 40,
                  padding: '0 14px',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  fontSize: 13,
                  cursor: 'pointer',
                  flex: 'none',
                  ...(sel
                    ? {
                        background: '#BEE3C9',
                        color: '#0B1711',
                        fontWeight: 500,
                      }
                    : { background: 'transparent', color: '#E7F0EA' }),
                  ...(i === active && sel
                    ? { boxShadow: 'inset 0 0 0 2px rgba(11,23,17,0.35)' }
                    : {}),
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
