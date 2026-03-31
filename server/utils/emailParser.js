import { parse } from 'csv-parse/sync';

export const parseEmailsFromBuffer = (buffer) => {
  if (!buffer) return [];
  const content = buffer.toString("utf-8").trim();
  if (!content) return [];

  // Determine if it's a CSV with headers or a simple list
  const firstLine = content.split(/\r?\n/)[0].toLowerCase();
  
  if (firstLine.includes('email') || firstLine.includes(',')) {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });

      // Map to standard { name, email, phone } structure
      return records.map(record => ({
        name: record.name || record.Name || "",
        email: (record.email || record.Email || Object.values(record)[0] || "").toLowerCase(),
        phone: record.phone || record.Phone || ""
      })).filter(r => r.email);
    } catch (e) {
      console.error("CSV parse error, falling back to basic split", e);
      // Fallback
    }
  }

  // Fallback for simple newline separated list
  return content
    .split(/\r?\n/)
    .map(e => ({ name: "", email: e.trim().toLowerCase(), phone: "" }))
    .filter(r => r.email);
};

