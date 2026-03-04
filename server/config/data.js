export const DEFAULT_CONFIG = {
  dnsTimeout: 5000,
  smtpTimeout: 10000,
  enableSmtpCheck: true,
  checkCatchAll: true,
  detectDisposable: true,
  customBlacklist: [],
  testFromEmail: 'verify@example.org',
  // Cache configuration
  enableCache: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  // Retry configuration
  maxRetries: 2,
  retryDelay: 1000 // milliseconds
};

export const LIMITS = {
  EMAIL_MAX: 320,
  LOCAL_MAX: 64,
  DOMAIN_MAX: 255
};

export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'trashmail.com',
  "0-mail.com",
  "0clickemail.com",
  "0wnd.net",
  "0wnd.org",
  "10minutemail.com",
  "10-minute-mail.com",
  "10mail.com",
  "20minutemail.com",
  "0815.ru",
  "1secmail.com",
  "1secmail.org",
  "1secmail.net",
  "tempmail.net",
  "tempmail.org",
  "maildrop.cc",
  "fakeinbox.com",
  "tempr.email",
  "emailtmp.com",
  "mailforspam.com",
  "spam4.me",
  "dropmail.me",
  "dispostable.com",
  "getnada.com",
  "mintemail.com",
  "mytemp.email",
  "spambox.us",
  "mailnesia.com"
]);

export const ROLE_ACCOUNTS = new Set([
  'admin', 'administrator', 'info', 'support', 'help',
  'contact', 'sales', 'billing', 'abuse', 'postmaster',
  'webmaster', 'security', 'noc', 'noreply', 'no-reply', 'team', 'office',
  'service', 'customerservice', 'marketing'
]);


export const PROVIDER_PATTERNS = [
  { name: 'Google', type: 'free', match: /google|gmail/i },
  { name: 'Microsoft', type: 'free', match: /outlook|hotmail|microsoft/i },
  { name: 'Yahoo', type: 'free', match: /yahoo/i },
  { name: 'Amazon SES', type: 'service', match: /amazonaws/i },
  { name: 'Zoho', type: 'business', match: /zoho/i }
];

export const SMTP_SKIP_MX = [
  /google\.com$/i,
  /googlemail\.com$/i,
  /outlook\.com$/i,
  /yahoodns\.net$/i,
  /icloud\.com$/i
];