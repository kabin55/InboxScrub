import Domain from '../../models/domain.js';
import { validateDomain } from '../../validators/domain.validator.js';
import { lookupMx } from '../../validators/mx.validator.js';
import { isDisposable } from '../../validators/disposable.validator.js';
import { detectCatchAll } from '../../validators/smtpValidator/catchAll.js';
import { DISPOSABLE_DOMAINS } from '../../config/data.js';

export async function validateAndSaveDomain(domain, config) {
    const domainData = {
        domain,
        validDomain: false,
        mxRecord: false,
        mxRecords: [],
        disposableDomain: false,
        isCatchAll: false,
        smtpFailed: false,
        createdAt: new Date()
    };

    const domainResult = await validateDomain(domain, config.dnsTimeout);
    const domainValid = typeof domainResult === 'object' ? domainResult.valid : domainResult;

    domainData.validDomain = domainValid;
    if (!domainValid) {
        return await Domain.findOneAndUpdate({ domain }, domainData, { upsert: true, new: true });
    }

    const blacklist = new Set([...DISPOSABLE_DOMAINS, ...(config.customBlacklist || [])]);
    if (config.detectDisposable && isDisposable(domain, blacklist)) {
        domainData.disposableDomain = true;
    }

    const mx = await lookupMx(domain, config.dnsTimeout);

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

    return await Domain.findOneAndUpdate({ domain }, domainData, { upsert: true, new: true });
}
