import React from "react";
import { Coffee, ExternalLink, MapPin, Scissors, Search, Store } from "lucide-react";

/**
 * Categories shown in the "Category" select. Each entry drives the
 * "Business type" select via its `keywords` list.
 */
export const CATEGORIES = [
  {
    id: "personal-care",
    label: "Personal Care & Grooming Services",
    icon: Scissors,
    keywords: ["barbershop", "salon", "nail salon", "spa", "massage"],
  },
  {
    id: "specialty-retail",
    label: "Specialty Retail & Boutique Shops",
    icon: Store,
    keywords: [
      "boutique",
      "gift shop",
      "flower shop",
      "bookstore",
      "thrift shop",
    ],
  },
  {
    id: "dining",
    label: "Food, Beverage & Entertainment (Discretionary Dining)",
    icon: Coffee,
    keywords: ["coffee shop", "cafe", "bakery", "restaurant", "bar"],
  },
];

/**
 * Declarative form definition. The scraper form renders each entry generically,
 * so adding a field here is enough to add it to the UI.
 *
 * - `type`: "text" | "select" | "number"
 * - `options`: static array or a function of the current form values
 * - `onChange`: optional hook fired with (nextValue, setValues) before state updates
 * - `hint`: helper microcopy rendered under the control
 */
export const FORM_FIELDS = [
  {
    name: "city",
    label: "City",
    type: "text",
    required: true,
    placeholder: "e.g. Cebu City, Manila, Davao",
    autoComplete: "address-level2",
    icon: Search,
    hint: "City or area to search on Google Maps.",
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: () =>
      CATEGORIES.map((item) => ({ value: item.label, label: item.label })),
    onChange: (nextValue, setValues) => {
      const next =
        CATEGORIES.find((item) => item.label === nextValue) || CATEGORIES[0];
      setValues((current) => ({ ...current, keyword: next.keywords[0] }));
    },
    hint: "Broad industry grouping for the search.",
  },
  {
    name: "keyword",
    label: "Business type",
    type: "select",
    options: (values) => {
      const category =
        CATEGORIES.find((item) => item.label === values.category) ||
        CATEGORIES[0];
      return category.keywords.map((keyword) => ({
        value: keyword,
        label: keyword,
      }));
    },
    hint: "Specific business type used in the Maps query.",
  },
  {
    name: "limit",
    label: "Daily rows",
    type: "number",
    min: 1,
    max: 100,
    defaultValue: 100,
    hint: "Maximum rows to collect (1–100).",
  },
];

/** Build the initial values object from the form config. */
export function initialFormValues() {
  return FORM_FIELDS.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? "";
    return acc;
  }, {});
}

/** Cell renderers shared by the result columns below. */
function isLink(value) {
  return typeof value === "string" && value.startsWith("http");
}

function ExternalCell({ href, children }) {
  return (
    <a className="cell-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

function Dash() {
  return <span className="dash">—</span>;
}

/**
 * Declarative result-table definition. The table renders headers and cells
 * from this list; `data-label` also drives the mobile card layout.
 */
export const RESULT_COLUMNS = [
  { key: "shopName", label: "Shop name" },
  {
    key: "email",
    label: "Email",
    render: (row) =>
      isLink(`mailto:${row.email}`) && row.email !== "-" ? (
        <a className="cell-link" href={`mailto:${row.email}`}>
          {row.email}
        </a>
      ) : (
        <Dash />
      ),
  },
  { key: "number", label: "Phone", mono: true },
  {
    key: "accountLink",
    label: "Social account",
    render: (row) =>
      isLink(row.accountLink) ? (
        <ExternalCell href={row.accountLink}>{displayHost(row.accountLink)}</ExternalCell>
      ) : (
        <Dash />
      ),
  },
  {
    key: "facebookLink",
    label: "Facebook",
    render: (row) =>
      isLink(row.facebookLink) ? (
        <ExternalCell href={row.facebookLink}>{displayHost(row.facebookLink)}</ExternalCell>
      ) : (
        <Dash />
      ),
  },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  {
    key: "mapsUrl",
    label: "Maps",
    render: (row) =>
      isLink(row.mapsUrl) ? (
        <a className="cell-link" href={row.mapsUrl} target="_blank" rel="noreferrer">
          <MapPin size={14} aria-hidden="true" />
          Open
        </a>
      ) : (
        <Dash />
      ),
  },
];

function displayHost(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : host;
  } catch {
    return url;
  }
}
