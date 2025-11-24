const DEFAULT_DATE_KEYS = [
  "createdAt",
  "created_at",
  "createdDate",
  "created_date",
  "created",
  "createdOn",
  "created_on",
];

const DEFAULT_FALLBACK_KEYS = ["updatedAt", "updated_at", "id"];

const toTimestamp = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }

  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  return null;
};

const getTimestamp = (item, keys) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const ts = toTimestamp(item[key]);
      if (ts !== null) {
        return ts;
      }
    }
  }

  return null;
};

export const sortByNewest = (items, options = {}) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const dateKeys = options.dateKeys || DEFAULT_DATE_KEYS;
  const fallbackKeys = options.fallbackKeys || DEFAULT_FALLBACK_KEYS;

  return [...items].sort((a, b) => {
    const timeA =
      getTimestamp(a, dateKeys) ?? getTimestamp(a, fallbackKeys) ?? 0;
    const timeB =
      getTimestamp(b, dateKeys) ?? getTimestamp(b, fallbackKeys) ?? 0;

    return timeB - timeA;
  });
};


