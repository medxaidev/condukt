import { build } from 'esbuild';
import { writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'node:*'
];

const dtsSource = './dist/index.d.ts';
const dtsEsmDest = './dist/esm/index.d.ts';
const dtsCjsDest = './dist/cjs/index.d.ts';

console.log('Running api-extractor...');
execSync('api-extractor run --local', { stdio: 'inherit' });

const baseOptions = {
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2022', 'chrome58', 'firefox57', 'safari11'],
  tsconfig: 'tsconfig.json',
  loader: { '.ts': 'ts', '.tsx': 'tsx', '.css': 'css' },
  resolveExtensions: ['.js', '.ts', '.tsx'],
  external
};

// 顺序构建 ESM
async function buildESM() {
  console.log('Building ESM...');
  await build({
    ...baseOptions,
    entryPoints: ['./src/index.ts'],
    format: 'esm',
    outfile: './dist/esm/index.mjs'
  });

  // 复制类型声明
  copyFileSync(dtsSource, dtsEsmDest);

  // 写子 package.json
  writeFileSync(
    './dist/esm/package.json',
    JSON.stringify(
      {
        type: 'module',
        main: 'index.mjs',
        types: 'index.d.ts'
      },
      null,
      2
    )
  );

  console.log('ESM build finished.');
}

// 顺序构建 CJS
async function buildCJS() {
  console.log('Building CJS...');
  await build({
    ...baseOptions,
    entryPoints: ['./src/index.ts'],
    format: 'cjs',
    outfile: './dist/cjs/index.cjs'
  });

  // 复制类型声明
  copyFileSync(dtsSource, dtsCjsDest);

  // 写子 package.json
  writeFileSync(
    './dist/cjs/package.json',
    JSON.stringify(
      {
        type: 'commonjs',
        main: 'index.cjs',
        types: 'index.d.ts'
      },
      null,
      2
    )
  );

  console.log('CJS build finished.');
}

// 主函数顺序执行
async function main() {
  try {
    await buildESM();
    await buildCJS();
    console.log('Build all done.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();