import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-audit-'));

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching headless Chrome on port 9226...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempDir}`,
    '--remote-debugging-port=9226',
    '--window-size=1280,800',
    'about:blank',
  ]);

  let wsUrl = '';
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch('http://127.0.0.1:9226/json');
      const data = await res.json();
      const pageTarget = data.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension:'));
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        console.log('Found page target:', pageTarget.url);
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to locate Chrome page target');
    chromeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => { ws.onopen = r; });

  let idCounter = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) cb({ error: msg.error });
        else cb({ result: msg.result });
      }
    } catch {}
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const timer = setTimeout(() => {
        callbacks.delete(id);
        reject(new Error(`Timeout waiting for ${method}`));
      }, 12000);
      callbacks.set(id, (res) => {
        clearTimeout(timer);
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 1000,
    });
    await sleep(500);
  }

  async function takeScreenshot(fileName) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${fileName}`);
  }

  async function evaluate(expression) {
    return await send('Runtime.evaluate', { expression });
  }

  // 1. Sign In Page
  console.log('1. Capturing Sign In Page...');
  await evaluate(`window.location.href = 'http://localhost:4173/signin'`);
  await sleep(2000);
  await setViewport(1280, 800);
  await takeScreenshot('signin-desktop.png');
  await setViewport(800, 900);
  await takeScreenshot('signin-800px.png');

  // 2. Sign in as Senior Investigator
  console.log('2. Signing in as Senior Investigator...');
  await setViewport(1280, 800);
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const invBtn = buttons.find(b => b.textContent && b.textContent.includes('Senior Investigator'));
      if (invBtn) invBtn.click();
    })()
  `);
  await sleep(2500);

  // 3. Cases to Review
  console.log('3. Capturing Cases to Review...');
  await setViewport(1280, 800);
  await takeScreenshot('cases-desktop.png');
  await setViewport(800, 900);
  await takeScreenshot('cases-800px.png');

  // 4. Case Detail
  console.log('4. Capturing Case Detail...');
  await setViewport(1280, 800);
  await evaluate(`
    (() => {
      const row = document.querySelector('tbody tr');
      if (row) row.click();
    })()
  `);
  await sleep(2500);
  await takeScreenshot('case-detail-desktop.png');
  await setViewport(800, 900);
  await takeScreenshot('case-detail-800px.png');

  // 5. Name Requests
  console.log('5. Capturing Name Requests...');
  await setViewport(1280, 800);
  await evaluate(`
    (() => {
      const navLinks = Array.from(document.querySelectorAll('nav a'));
      const reqLink = navLinks.find(a => a.textContent && a.textContent.includes('Name requests'));
      if (reqLink) reqLink.click();
    })()
  `);
  await sleep(2500);
  await takeScreenshot('name-requests-desktop.png');
  await setViewport(800, 900);
  await takeScreenshot('name-requests-800px.png');

  // 6. Activity Log
  console.log('6. Capturing Activity Log...');
  await setViewport(1280, 800);
  await evaluate(`
    (() => {
      const navLinks = Array.from(document.querySelectorAll('nav a'));
      const auditLink = navLinks.find(a => a.textContent && a.textContent.includes('Activity log'));
      if (auditLink) auditLink.click();
    })()
  `);
  await sleep(2500);
  await takeScreenshot('activity-log-desktop.png');
  await setViewport(800, 900);
  await takeScreenshot('activity-log-800px.png');

  console.log('All 10 screenshots successfully captured!');
  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});
