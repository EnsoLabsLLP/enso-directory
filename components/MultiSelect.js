"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

// Searchable multi-select with grouped options and custom entries.
// options: [{ value, label, chip?, group?, icon?, description?, meta?, keys? }]
// value: array of stored strings (an option's value, or anything custom the admin typed).
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const TRAINING = " (in training)";
const isTraining = (v) => /\bin training\b/i.test(String(v));
const base = (v) => String(v).replace(/\s*\(?\s*in training\s*\)?\s*$/i, "").trim();

export default function MultiSelect({ id, options, groups, value, onChange, placeholder = "Search, or type your own", training = false, describedBy }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const input = useRef(null);
  const list = useRef(null);
  const uid = useId().replace(/:/g, "");
  const listId = `${id}-list`;

  const byKey = useMemo(() => {
    const m = new Map();
    for (const o of options) for (const k of [o.value, o.label, o.chip, ...(o.keys || [])]) {
      const n = norm(k);
      if (n && !m.has(n)) m.set(n, o);
    }
    return m;
  }, [options]);
  const optionOf = (v) => byKey.get(norm(base(v))) || null;
  const picked = new Set(value.map((v) => optionOf(v)?.value ?? "custom:" + norm(base(v))));

  const nq = norm(q);
  const shown = useMemo(() => {
    const hits = nq ? options.filter((o) => [o.label, o.chip, o.meta, ...(o.keys || [])].some((k) => norm(k).includes(nq))) : options;
    if (!groups) return hits.map((o) => ({ o, group: null }));
    const out = [];
    for (const g of groups) for (const o of hits) if (o.group === g.id) out.push({ o, group: g });
    return out;
  }, [options, groups, nq]);
  const exact = nq && byKey.get(nq);
  const already = nq && value.some((v) => norm(base(v)) === nq);
  const canAdd = Boolean(q.trim()) && !exact && !already;
  const count = shown.length + (canAdd ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, [open]);
  useEffect(() => { setActive(0); }, [nq]);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const toggle = (o) => {
    if (picked.has(o.value)) onChange(value.filter((v) => optionOf(v)?.value !== o.value));
    else onChange([...value, o.value]);
  };
  const addCustom = () => {
    const t = q.trim().replace(/\s+/g, " ");
    if (t) onChange([...value, t]);
    setQ("");
  };
  const remove = (v) => onChange(value.filter((x) => x !== v));
  const flipTraining = (v) => onChange(value.map((x) => (x === v ? (isTraining(v) ? base(v) : base(v) + TRAINING) : x)));
  const choose = (i) => {
    if (i < shown.length) {
      toggle(shown[i].o);
      if (q) setQ(""); // ready for the next search
    } else if (canAdd) addCustom();
    input.current?.focus();
  };

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(count - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (count) choose(active);
    } else if (e.key === "Escape") { if (open) { e.preventDefault(); setOpen(false); } }
    else if (e.key === "Backspace" && !q && value.length) remove(value[value.length - 1]);
    else if (e.key === "Tab") setOpen(false);
  }

  let lastGroup = null;
  return (
    <div className="ms" ref={wrap}>
      <div className={`ms-box ${open ? "open" : ""}`} onClick={() => { setOpen(true); input.current?.focus(); }}>
        {value.map((v) => {
          const o = optionOf(v);
          const train = training && o && isTraining(v);
          return (
            <span key={v} className={`ms-chip ${o ? "" : "custom"} ${train ? "training" : ""}`} title={o ? o.label : "Your own option"}>
              {o?.icon && <Icon name={o.icon} size={14} />}
              <span>{o ? o.chip || o.label : base(v)}</span>
              {training && o && (
                <button type="button" className="ms-train" aria-pressed={train} onClick={(e) => { e.stopPropagation(); flipTraining(v); }} title={train ? "Marked as still in training. Click to undo." : "Mark as still in training"}>
                  {train ? "in training" : "+ in training"}
                </button>
              )}
              <button type="button" className="ms-x" aria-label={`Remove ${o ? o.chip || o.label : base(v)}`} onClick={(e) => { e.stopPropagation(); remove(v); }}>
                <Icon name="x" size={13} />
              </button>
            </span>
          );
        })}
        <input
          ref={input}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && count ? `${uid}-${active}` : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          value={q}
          placeholder={value.length ? "Add more" : placeholder}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        <Icon name="chevron-down" size={16} className="ms-chev" />
      </div>
      {open && (
        <div className="ms-pop">
          <ul className="ms-list" id={listId} role="listbox" aria-multiselectable="true" ref={list}>
            {shown.map(({ o, group }, i) => {
              const head = group && group.id !== lastGroup ? group : null;
              lastGroup = group?.id ?? null;
              const on = picked.has(o.value);
              return [
                head && <li key={"g-" + head.id} className="ms-group" role="presentation">{head.icon && <Icon name={head.icon} size={14} />}{head.label}</li>,
                <li
                  key={o.value}
                  id={`${uid}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={on}
                  className={`ms-opt ${i === active ? "active" : ""} ${on ? "on" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                >
                  <span className="ms-box-tick">{on && <Icon name="check" size={13} strokeWidth={2.5} />}</span>
                  {o.icon && <Icon name={o.icon} size={17} className="ms-ic" />}
                  <span className="ms-text">
                    <span className="ms-label">{o.label}{o.meta && <span className="ms-meta">{o.meta}</span>}</span>
                    {o.description && <span className="ms-desc">{o.description}</span>}
                  </span>
                </li>
              ];
            })}
            {canAdd && (
              <li
                id={`${uid}-${shown.length}`}
                data-i={shown.length}
                role="option"
                aria-selected={false}
                className={`ms-opt ms-add ${active === shown.length ? "active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(shown.length)}
                onClick={() => choose(shown.length)}
              >
                <span className="ms-box-tick"><Icon name="plus" size={13} strokeWidth={2.5} /></span>
                <span className="ms-text"><span className="ms-label">Add “{q.trim()}”</span><span className="ms-desc">Not in the list. It will show on their profile as typed.</span></span>
              </li>
            )}
            {!count && <li className="ms-empty" role="presentation">Already added.</li>}
          </ul>
          <div className="ms-foot">
            <span>{value.length ? `${value.length} selected` : "Pick as many as apply"}</span>
            <button type="button" className="textbtn" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
