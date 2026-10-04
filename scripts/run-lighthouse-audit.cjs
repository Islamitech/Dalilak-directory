const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn, execSync } = require('child_process');

const REPORTS_DIR = path.resolve(__dirname, '../reports/evidence/lighthouse');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function waitForPort(port, host = '127.0.0.1', timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        socket.destroy();
        retry();
      });
      socket.once('error', () => {
        socket.destroy();
        retry();
      });
      socket.connect(port, host);
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for port ${port}`));
      } else {
        setTimeout(tryConnect, 300);
      }
    };

    tryConnect();
  });
}

async function runLighthouseAudit() {
  const port = 5199;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Spawning Vite preview server on port ${port}...`);

  const serverProc = spawn('npx.cmd', ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
    shell: true,
  });

  serverProc.on('error', (err) => {
    console.error('Server proc error:', err);
  });

  try {
    await waitForPort(port);
    console.log(`📡 Preview server is listening at ${baseUrl}`);

    const pages = [
      { name: 'home', path: '/' },
      { name: 'search', path: '/search' },
      { name: 'map', path: '/map' },
    ];

    const results = {};
    process.env.CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

    for (const page of pages) {
      const url = baseUrl + page.path;
      const reportPath = path.join(REPORTS_DIR, `${page.name}-mobile.json`);
      console.log(`\n🔍 Auditing ${page.name} (${url}) [Mobile]...`);

      const cmd = `npx lighthouse "${url}" --output=json --output-path="${reportPath}" --form-factor=mobile --screenEmulation.mobile=true --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo --throttling-method=provided --blocked-url-patterns="*googletagmanager*,*google-analytics*" --max-wait-for-load=30000 --quiet`;

      try {
        execSync(cmd, { stdio: 'inherit' });
        if (fs.existsSync(reportPath)) {
          const rawJson = fs.readFileSync(reportPath, 'utf8');
          const report = JSON.parse(rawJson);
          const categories = report.categories || {};
          results[page.name] = {
            url: page.path,
            performance: Math.round((categories.performance?.score || 0) * 100),
            accessibility: Math.round((categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
            seo: Math.round((categories.seo?.score || 0) * 100),
          };
          console.log(`✅ [${page.name}] Scores:`, results[page.name]);
        }
      } catch (e) {
        console.log(`⚠️ Lighthouse run for ${page.name} encountered error:`, e.message);
        results[page.name] = { url: page.path, error: e.message };
      }
    }

    const summaryPath = path.resolve(__dirname, '../reports/evidence/lighthouse-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📊 Saved Lighthouse summary to ${summaryPath}`);
    console.log(JSON.stringify(results, null, 2));
  } finally {
    console.log('🛑 Terminating preview server process...');
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${serverProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        serverProc.kill();
      }
    } catch {}
  }
}

runLighthouseAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
