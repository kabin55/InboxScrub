import { LIMITS } from '../config/data.js';

export function validateLocalPart(local) {
  if (!local) return false;
  if (
    local.length > LIMITS.LOCAL_MAX ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local)
  ) {
    console.log(`[LocalPartValidator] Invalid local part: ${local}`);
    return false;
  }

  return true;
}


