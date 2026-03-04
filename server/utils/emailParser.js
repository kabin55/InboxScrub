export const parseEmailsFromBuffer = (buffer) => {
  return buffer
    .toString("utf-8")
    .split(/\r?\n/)
    .map(e => e.trim())
    .filter(Boolean);
};

