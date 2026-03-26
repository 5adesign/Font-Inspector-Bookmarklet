const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const targetPath = path.join(rootDir, 'src', 'font-inspector.js');

let timeoutId = null;
let active = false;
let queued = false;

function runBuild() {
  if (active) {
    queued = true;
    return;
  }

  active = true;
  const child = spawn(process.execPath, [path.join(__dirname, 'build-bookmarklet.js')], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    active = false;
    if (code !== 0) {
      console.error(`Build failed with exit code ${code}`);
    }
    if (queued) {
      queued = false;
      runBuild();
    }
  });
}

function scheduleBuild() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(runBuild, 80);
}

console.log(`Watching ${path.relative(rootDir, targetPath)}...`);
runBuild();

fs.watch(path.dirname(targetPath), (eventType, filename) => {
  if (!filename || filename !== path.basename(targetPath)) return;
  if (eventType !== 'change' && eventType !== 'rename') return;
  scheduleBuild();
});
