import { DEFAULT_CONFIG } from '../../config/data.js';
import { validateSyntax } from '../../validators/syntax.validator.js';
import { validateLocalPart } from '../../validators/localPart.validator.js';
import { validateDomain } from '../../validators/domain.validator.js';
import { isDisposable } from '../../validators/disposable.validator.js';
import { isRoleAccount } from '../../validators/roleBased.validator.js';
import { verifyMailbox } from '../../validators/smtpValidator/mailBox.js';
import { getCachedResult, setCachedResult } from '../../utils/validation-cache.js';
import Domain from '../../models/domain.js';
import { validateAndSaveDomain } from './domain.service.js';

function setResult(resultObj, value, reason = null) {
  resultObj.value = value;
  resultObj.reason = reason;
}

function calculateConfidence(results, smtpInconclusive) {
  if (Object.values(results).every(v => v.value) && !smtpInconclusive) {
    return 'High';
  }

  if (
    !results.syntax.value ||
    !results.domain.value ||
    !results.mx.value ||
    !results.disposable.value ||
    (results.smtp.value === false && !smtpInconclusive)
  ) {
    return 'Low';
  }

  if (!results.catchAll.value) {
    return 'Medium';
  }

  return 'Medium';
}

export async function validateEmailDeliverability(email, userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const startTime = Date.now();

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

    const syntax = validateSyntax(email);
    if (!syntax.valid) {
      setResult(response.results.syntax, false, 'Invalid email syntax');
      response.confidence = 'Low';
      if (config.enableCache !== false) setCachedResult(email, response);
      return response;
    }
    setResult(response.results.syntax, true);

    if (!validateLocalPart(syntax.localPart)) {
      setResult(response.results.roleBased, false, 'Invalid local-part format');
    } else if (isRoleAccount(syntax.localPart)) {
      setResult(response.results.roleBased, false, 'Email uses a role-based prefix');
    } else {
      setResult(response.results.roleBased, true);
    }

    let mx = [];
    let domainDoc = await Domain.findOne({ domain: syntax.asciiDomain });

    if (!domainDoc || (domainDoc.mxRecord && (!domainDoc.mxRecords || domainDoc.mxRecords.length === 0))) {
      domainDoc = await validateAndSaveDomain(syntax.asciiDomain, config);
    }

    setResult(response.results.domain, domainDoc.validDomain, domainDoc.validDomain ? null : 'Domain validation failed');
    setResult(response.results.disposable, domainDoc.disposableDomain ? false : true, domainDoc.disposableDomain ? 'Domain is listed as disposable' : null);
    setResult(response.results.mx, domainDoc.mxRecord ? true : false, domainDoc.mxRecord ? null : 'No MX records found');
    setResult(response.results.catchAll, domainDoc.isCatchAll ? false : true, domainDoc.isCatchAll ? 'Domain is catch-all' : null);

    if (!domainDoc.validDomain || !domainDoc.mxRecord) return response;

    mx = domainDoc.mxRecords || [];

    const smtpTimeout = config.smtpTimeout || 5000; 
    const retryConfig = { maxRetries: config.maxRetries || 2, retryDelay: config.retryDelay || 1000 };

    let smtpInconclusive = false;
    let smtpMetadata = [];

    if (config.enableSmtpCheck) {
      const mxPromises = mx.map(mxServer => {
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

    response.confidence = calculateConfidence(response.results, smtpInconclusive);

    const resultOrder = ['catchAll', 'roleBased', 'smtp', 'syntax', 'domain', 'mx', 'disposable'];
    response.results = Object.fromEntries(resultOrder.map(key => [key, response.results[key]]));

    response.metadata = {
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      mxRecordsChecked: mx?.length || 0,
      smtpResults: smtpMetadata, 
      cached: false
    };

    if (config.enableCache !== false) setCachedResult(email, response);
    return response;

  } catch (err) {
    console.error('Email validation failed:', err);
    response.confidence = 'Low';
    response.metadata = { error: err.message, timestamp: new Date().toISOString() };
    return response;
  }
}
