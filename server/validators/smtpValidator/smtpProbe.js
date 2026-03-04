import net from 'net';

export function smtpProbe(mxHost, commands, timeout) {
  return new Promise(resolve => {
    const socket = net.createConnection(25, mxHost);
    let buffer = '', index = 0;

    socket.setTimeout(timeout);

    socket.on('data', data => {
      buffer += data.toString();
      let offset = 0;

      while (true) {
        const idx = buffer.indexOf('\r\n', offset);
        if (idx === -1) break;
        const line = buffer.slice(offset, idx);
        offset = idx + 2;
        if (line.length < 3) continue;

        const codeVal = parseInt(line.slice(0, 3));
        const sep = line[3];
        if (sep === '-') continue; // multi-line

        if (index < commands.length) {
          const cmd = commands[index++];
          console.log(`[SMTP] Sending to ${mxHost}: ${cmd}`);
          socket.write(cmd + '\r\n');
        } else {
          socket.destroy();
          console.log(`[SMTP] Finished ${mxHost} with code ${codeVal}`);
          resolve({ code: codeVal });
          return;
        }
      }
      buffer = buffer.slice(offset);
    });

    socket.on('timeout', () => { socket.destroy(); resolve({ code: null, reason: 'timeout' }); });
    socket.on('error', () => { resolve({ code: null, reason: 'connection-error' }); });
  });
}

export async function smtpProbeWithRetry(mx, commands, timeout, { maxRetries = 2, retryDelay = 1000 } = {}) {
  let lastResult = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await smtpProbe(mx, commands, timeout);
    lastResult = result;

    if ([250, 251].includes(result.code)) return { ...result, attempts: attempt + 1 };
    if ([550, 551, 553, 554].includes(result.code)) return { ...result, attempts: attempt + 1 };

    if (attempt < maxRetries) await new Promise(r => setTimeout(r, retryDelay * Math.pow(2, attempt)));
  }
  return { ...lastResult, attempts: maxRetries + 1 };
}
