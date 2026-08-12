import React from "react";
import { Loader2, Play } from "lucide-react";
import { FORM_FIELDS } from "../config";

export default function ScraperForm({ values, setValues, status, rows, limit, onSubmit }) {
  const busy = status === "loading";
  const canSubmit = values.city.trim().length >= 2 && !busy;

  return (
    <aside className="card search-card">
      <div className="card-head">
        <h2>New search</h2>
        <p>Find public business listings by city and category.</p>
      </div>

      <form className="scrape-form" onSubmit={onSubmit}>
        {FORM_FIELDS.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name]}
            values={values}
            setValues={setValues}
          />
        ))}

        <button className="primary-action" type="submit" disabled={!canSubmit}>
          {busy ? (
            <Loader2 size={18} aria-hidden="true" className="spin-icon" />
          ) : (
            <Play size={18} aria-hidden="true" />
          )}
          {busy ? `Scraping… ${rows.length}/${limit}` : "Start scrape"}
        </button>
      </form>
    </aside>
  );
}

function FormField({ field, value, values, setValues }) {
  const id = `field-${field.name}`;
  const options =
    typeof field.options === "function" ? field.options(values) : field.options;
  const Icon = field.icon;

  function handleChange(nextValue) {
    if (field.onChange) {
      field.onChange(nextValue, setValues);
    }
    setValues((current) => ({ ...current, [field.name]: nextValue }));
  }

  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{field.label}</label>
        {field.required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </div>

      {field.type === "select" ? (
        <select id={id} value={value} onChange={(event) => handleChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
        />
      ) : (
        <div className="input-shell">
          {Icon && <Icon size={17} aria-hidden="true" />}
          <input
            id={id}
            value={value}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            aria-required={field.required}
            onChange={(event) => handleChange(event.target.value)}
          />
        </div>
      )}

      {field.hint && <p className="field-hint">{field.hint}</p>}
    </div>
  );
}
