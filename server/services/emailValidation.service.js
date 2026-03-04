
import { DEFAULT_CONFIG, DISPOSABLE_DOMAINS } from '../config/data.js';
import { validateSyntax } from '../validators/syntax.validator.js';
import { validateLocalPart } from '../validators/localPart.validator.js';
import { validateDomain } from '../validators/domain.validator.js';

import { isDisposable } from '../validators/disposable.validator.js';
import { isRoleAccount } from '../validators/roleBased.validator.js';

import { verifyMailbox } from '../validators/smtpValidator/mailBox.js';
import { getCachedResult, setCachedResult } from '../utils/validation-cache.js';
import Domain from '../models/domain.js';
import { validateAndSaveDomain } from '../services/domain.service.js';


// --- Helper functions ---
function setResult(resultObj, value, reason = null) {
  resultObj.value = value;
  resultObj.reason = reason;
}



// --- Main validation function ---
function calculateConfidence(results, smtpInconclusive) {
  // 1. All checks passed -> High (Deliverable)
  if (Object.values(results).every(v => v.value) && !smtpInconclusive) {
    return 'High';
  }

  // 2. Critical failures -> Low (Undeliverable)
  if (
    !results.syntax.value ||
    !results.domain.value ||
    !results.mx.value ||
    !results.disposable.value ||
    (results.smtp.value === false && !smtpInconclusive)
  ) {
    return 'Low';
  }

  // 3. Catch-All -> Medium (Risky)
  if (!results.catchAll.value) {
    return 'Medium';
  }

  // 4. Risks -> Medium (Risky)
  return 'Medium';
}

// --- Main validation function ---
export async function validateEmailDeliverability(email, userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const startTime = Date.now();

  // --- Initialize response ---
  const response = {
    email,
    results: {
      syntax: { value: false, reason: null },
      domain: { value: false, reason: null },
      mx: { value: false, reason: null },
      disposable: { value: false, reason: null },
      roleBased: { value: false, reason: null },
      catchAll: { value: true, reason: null },
      smtp: { value: true, reason: null },
    },
    confidence: 'Low',
    metadata: {}
  };

  try {
    // --- 1. Check cache ---
    if (config.enableCache !== false) {
      const cached = getCachedResult(email, config.cacheTTL);
      if (cached) {
        return {
          ...cached,
          cached: true,
          cachedAt: new Date(cached.metadata?.timestamp || Date.now()).toISOString()
        };
      }
    }

    // --- 2. Syntax ---
    const syntax = validateSyntax(email);
    if (!syntax.valid) {
      setResult(response.results.syntax, false, 'Invalid email syntax');
      response.confidence = 'Low';
      if (config.enableCache !== false) setCachedResult(email, response);
      return response;
    }
    // Syntax blocks further checks
    setResult(response.results.syntax, true);

    // --- 3. Local part / Role based ---
    if (!validateLocalPart(syntax.localPart)) {
      setResult(response.results.roleBased, false, 'Invalid local-part format');
    } else if (isRoleAccount(syntax.localPart)) {
      setResult(response.results.roleBased, false, 'Email uses a role-based prefix');
    } else {
      setResult(response.results.roleBased, true);
    }

    // --- 4. Domain Handling ---
    let mx = [];

    let domainDoc = await Domain.findOne({ domain: syntax.asciiDomain });

    // Force re-validation if domain not found OR if cache is invalid (mxRecord=true but no records)
    if (!domainDoc || (domainDoc.mxRecord && (!domainDoc.mxRecords || domainDoc.mxRecords.length === 0))) {
      domainDoc = await validateAndSaveDomain(syntax.asciiDomain, config);
    }

    // Apply DB values to response
    setResult(
      response.results.domain,
      domainDoc.validDomain,
      domainDoc.validDomain ? null : 'Domain validation failed'
    );

    setResult(
      response.results.disposable,
      domainDoc.disposableDomain ? false : true,
      domainDoc.disposableDomain ? 'Domain is listed as disposable' : null
    );

    setResult(
      response.results.mx,
      domainDoc.mxRecord ? true : false,
      domainDoc.mxRecord ? null : 'No MX records found'
    );

    setResult(
      response.results.catchAll,
      domainDoc.isCatchAll ? false : true,
      domainDoc.isCatchAll ? 'Domain is catch-all' : null
    );

    // Stop early if domain invalid or no MX
    if (!domainDoc.validDomain || !domainDoc.mxRecord) {
      return response;
    }

    // Use stored MX only (NO new lookup)
    mx = domainDoc.mxRecords || [];


    // --- 5. SMTP verification ---
    const smtpTimeout = config.smtpTimeout || 5000; // max wait per server
    const retryConfig = { maxRetries: config.maxRetries || 2, retryDelay: config.retryDelay || 1000 };

    let smtpInconclusive = false;
    let smtpMetadata = [];

    if (config.enableSmtpCheck) {
      const mxPromises = mx.map(mxServer => {
        // Use Promise.race for cleaner timeout handling
        return Promise.race([
          verifyMailbox(email, [mxServer], config.testFromEmail, smtpTimeout, retryConfig),
          new Promise(resolve => setTimeout(() => resolve({ result: null, reason: 'timeout' }), smtpTimeout))
        ]).then(result => ({
          mx: mxServer.exchange,
          result: result.result,
          attempts: result.attempts || 1,
          reason: result.reason
        })).catch(err => ({
          mx: mxServer.exchange,
          result: false,
          reason: 'error',
          error: err.message
        }));
      });

      // Wait for all MX attempts to finish (or timeout)
      const results = await Promise.allSettled(mxPromises);

      let successful = false;
      let permanentFailure = false;

      for (const r of results) {
        if (r.status === 'fulfilled') {
          smtpMetadata.push(r.value);
          if (r.value.result === true) successful = true;
          if (r.value.result === false && r.value.reason === 'permanent-error') permanentFailure = true;
        } else {
          smtpMetadata.push({ mx: 'unknown', result: false, reason: 'rejected', error: r.reason });
        }
      }

      if (successful) {
        setResult(response.results.smtp, true);
        smtpInconclusive = false;
      } else if (permanentFailure) {
        setResult(response.results.smtp, false, 'Mailbox does not exist');
        smtpInconclusive = false;
      } else {
        setResult(response.results.smtp, false, 'No MX responded');
        smtpInconclusive = true;
      }
    }


    // --- 6. Confidence calculation ---
    response.confidence = calculateConfidence(response.results, smtpInconclusive);

    // --- 7. Reorder results ---
    const resultOrder = ['catchAll', 'roleBased', 'smtp', 'syntax', 'domain', 'mx', 'disposable'];
    response.results = Object.fromEntries(resultOrder.map(key => [key, response.results[key]]));

    // --- 8. Metadata & cache ---
    response.metadata = {
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      mxRecordsChecked: mx?.length || 0,
      smtpResults: smtpMetadata, // Store as array property, not spread
      cached: false
    };

    if (config.enableCache !== false) setCachedResult(email, response);

    console.log(`[EmailValidation] Result for ${email}:`, JSON.stringify(response, null, 2));
    return response;

  } catch (err) {
    console.error('Email validation failed:', err);
    response.confidence = 'Low';
    response.metadata = { error: err.message, timestamp: new Date().toISOString() };
    return response;
  }
}
