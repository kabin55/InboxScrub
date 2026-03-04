import Domain from '../models/domain.js';
import { validateDomain } from '../validators/domain.validator.js';
import { lookupMx } from '../validators/mx.validator.js';
import { isDisposable } from '../validators/disposable.validator.js';
import { detectCatchAll } from '../validators/smtpValidator/catchAll.js';
import { DISPOSABLE_DOMAINS } from '../config/data.js';

export async function validateAndSaveDomain(domain, config) {
    const domainData = {
        domain,
        validDomain: false,
        mxRecord: false,
        mxRecords: [],
        disposableDomain: false,
        isCatchAll: false,
        smtpFailed: false,
        // Update createdAt on refresh to reset TTL if needed, though Mongoose usually handles this on update if defined correctly
        createdAt: new Date()
    };

    // 1. Domain validation
    const domainResult = await validateDomain(domain, config.dnsTimeout);
    const domainValid = typeof domainResult === 'object' ? domainResult.valid : domainResult;

    domainData.validDomain = domainValid;
    if (!domainValid) {
        return await Domain.findOneAndUpdate({ domain }, domainData, { upsert: true, new: true });
    }

    // 2. Disposable check
    const blacklist = new Set([...DISPOSABLE_DOMAINS, ...(config.customBlacklist || [])]);
    if (config.detectDisposable && isDisposable(domain, blacklist)) {
        domainData.disposableDomain = true;
    }

    // 3. MX lookup
    // 3. MX lookup
    const mx = await lookupMx(domain, config.dnsTimeout);

    // Implicit MX Fallback (RFC 5321): If no MX records but A/AAAA exists (domainValid), use domain as MX.
    if (!mx?.length) {
        if (domainValid) {
            domainData.mxRecord = true;
            domainData.mxRecords = [{ exchange: domain, priority: 0 }];
        } else {
            return await Domain.findOneAndUpdate({ domain }, domainData, { upsert: true, new: true });
        }
    } else {
        domainData.mxRecord = true;
        domainData.mxRecords = mx;
    }

    // 4. Catch-all
    if (config.checkCatchAll) {
        const isCatchAll = await detectCatchAll(
            domain,
            mx,
            config.testFromEmail,
            config.smtpTimeout
        );

        if (isCatchAll === true) domainData.isCatchAll = true;
        else if (isCatchAll === null) domainData.smtpFailed = true;
    }

    console.log(`[DomainService] Saving domain data for ${domain}:`, JSON.stringify(domainData, null, 2));
    return await Domain.findOneAndUpdate({ domain }, domainData, { upsert: true, new: true });
}
