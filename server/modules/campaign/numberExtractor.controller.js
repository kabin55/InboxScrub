import fs from 'fs';
import EmailStatus from '../../models/emailStatus.js';

export const extractUnopenedNumbers = async (req, res) => {
    try {
        const { jobId } = req.params;
        const file = req.file;

        if (!jobId) {
            return res.status(400).json({ success: false, message: 'Job ID is required' });
        }

        if (!file) {
            return res.status(400).json({ success: false, message: 'File is required' });
        }

        const filePath = file.path;
        let fileContent = '';

        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        } catch (readError) {
            console.error('Failed to read uploaded file:', readError);
            return res.status(500).json({ success: false, message: 'Failed to read uploaded file' });
        }

        fs.unlinkSync(filePath);

        const lines = fileContent.split(/\r?\n/);
        
        const emailContactMap = new Map();

        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.includes(',') ? line.split(',') : line.split(/\s+/);
            
            let email = '';
            let contact = '';

            for (let part of parts) {
                part = part.trim().replace(/['"]/g, '');
                
                if (!email && emailRegex.test(part)) {
                    const match = part.match(emailRegex);
                    if (match) email = match[0].toLowerCase();
                } else {
                    const digits = part.replace(/\D/g, '');
                    if (digits.length >= 7) {
                        contact = part;
                    }
                }
            }

            if (!email && emailRegex.test(line)) {
                const match = line.match(emailRegex);
                if (match) email = match[0].toLowerCase();
                const digits = line.replace(email, '').replace(/\D/g, '');
                if (digits.length >= 7) {
                    contact = digits;
                }
            }

            if (email && contact) {
                emailContactMap.set(email, contact);
            }
        }

        if (emailContactMap.size === 0) {
             return res.status(400).json({ success: false, message: 'No valid email and contact pairs found in the file' });
        }

        const uploadedEmails = Array.from(emailContactMap.keys());

        const unopenedCampaignEmails = await EmailStatus.find({
            jobId: jobId,
            opened: false,
            email: { $in: uploadedEmails }
        }).select('email');

        const result = unopenedCampaignEmails.map(doc => {
            const email = doc.email.toLowerCase();
            return {
                email: email,
                contact: emailContactMap.get(email) || null
            };
        });

        const validResults = result.filter(r => r.contact !== null);

        res.status(200).json({
            success: true,
            extractedContacts: validResults
        });

    } catch (error) {
        console.error('Error in extractUnopenedNumbers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to extract numbers',
            error: error.message
        });
    }
};
