const disposableDomains = [
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
  "mailinator.com",
  "tempmail.net",
  "tempmail.org",
  "trashmail.com",
  "guerrillamail.com",
  "maildrop.cc",
  "fakeinbox.com",
  "tempr.email",
  "emailtmp.com",
  "mailforspam.com",
  "spam4.me",
  "dropmail.me",
  "dispostable.com",
  "yopmail.com",
  "getnada.com",
  "mintemail.com",
  "mytemp.email",
  "spambox.us",
  "mailnesia.com"
];

export function isDisposable(domain, blacklist) {
  const parts = domain.toLowerCase().split('.');
  for (let i = Math.max(0, parts.length - 2); i < parts.length; i++) {
    if (blacklist.has(parts.slice(i).join('.'))) {
      console.log(`[DisposableValidator] Domain ${domain} is disposable.`);
      return true;
    }
  }
  return false;
}

