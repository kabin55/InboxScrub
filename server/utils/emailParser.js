import { parse } from 'csv-parse';
import { Readable } from 'stream';

export const parseEmailsFromBuffer = async (buffer) => {
    if (!buffer) return [];
    
    return new Promise((resolve, reject) => {
        const content = buffer.toString("utf-8").trim();
        if (!content) return resolve([]);

        const firstLine = content.split(/\r?\n/)[0].toLowerCase();
        const emails = [];

        if (firstLine.includes('email') || firstLine.includes(',')) {
            const parser = parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true
            });

            parser.on('readable', function () {
                let record;
                while ((record = parser.read()) !== null) {
                    const email = (record.email || record.Email || Object.values(record)[0] || "").toLowerCase();
                    if (email) {
                        emails.push({
                            name: record.name || record.Name || "",
                            email: email,
                            phone: record.phone || record.Phone || ""
                        });
                    }
                }
            });

            parser.on('error', function (err) {
                console.error("CSV parse error, falling back to basic split", err);
                // Fallback to basic split
                resolve(content
                    .split(/\r?\n/)
                    .map(e => ({ name: "", email: e.trim().toLowerCase(), phone: "" }))
                    .filter(r => r.email)
                );
            });

            parser.on('end', function () {
                resolve(emails);
            });

            Readable.from(content).pipe(parser);
        } else {
            // Fallback for simple list
            resolve(content
                .split(/\r?\n/)
                .map(e => ({ name: "", email: e.trim().toLowerCase(), phone: "" }))
                .filter(r => r.email)
            );
        }
    });
};

