const fs = require('node:fs/promises');
const path = require('node:path');
const { minify } = require('terser');

const rootDir = path.resolve(__dirname, '..');
const inputPath = path.join(rootDir, 'src', 'font-inspector.js');
const bookmarkletPath = path.join(rootDir, 'bookmarklet.min.js');
const runtimePath = path.join(rootDir, 'font-inspector.runtime.js');
const loaderPath = path.join(rootDir, 'bookmarklet.loader.js');
const runtimeUrl = 'https://cdn.jsdelivr.net/gh/5adesign/Font-Inspector-Bookmarklet@main/font-inspector.runtime.js';

async function build() {
  const source = await fs.readFile(inputPath, 'utf8');
  const wrapped = `(function(){\n${source.trim()}\n}())`;

  const bookmarkletResult = await minify(wrapped, {
    compress: {
      passes: 2,
    },
    mangle: true,
    format: {
      ascii_only: true,
    },
  });

  const runtimeResult = await minify(wrapped, {
    compress: {
      passes: 2,
    },
    mangle: true,
    format: {
      ascii_only: true,
    },
  });

  if (!bookmarkletResult.code || !runtimeResult.code) {
    throw new Error('Minification produced no output.');
  }

  const bookmarkletOutput = `javascript:void${bookmarkletResult.code}\n`;
  const runtimeOutput = `${runtimeResult.code};\n`;
  const loaderOutput =
    "javascript:(function(){var d=document,s=d.getElementById('fi-loader');if(s)s.remove();s=d.createElement('script');s.id='fi-loader';s.src='" +
    runtimeUrl +
    "?t='+Date.now();(d.head||d.body||d.documentElement).appendChild(s)}())\n";

  await Promise.all([
    fs.writeFile(bookmarkletPath, bookmarkletOutput, 'utf8'),
    fs.writeFile(runtimePath, runtimeOutput, 'utf8'),
    fs.writeFile(loaderPath, loaderOutput, 'utf8'),
  ]);

  console.log(`Built ${path.relative(rootDir, bookmarkletPath)}`);
  console.log(`Built ${path.relative(rootDir, runtimePath)}`);
  console.log(`Built ${path.relative(rootDir, loaderPath)}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
