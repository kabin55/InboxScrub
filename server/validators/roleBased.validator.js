import { ROLE_ACCOUNTS } from '../config/data.js';

export function isRoleAccount(local) {
  const isRole = ROLE_ACCOUNTS.has(local.split('+')[0].toLowerCase());
  if (isRole) console.log(`[RoleBasedValidator] Role account detected: ${local}`);
  return isRole;
}