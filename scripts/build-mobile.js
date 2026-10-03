import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js'];
const directories = ['src', 'data', 'audio', 'icons'];

export function buildMobile(outputDirectory = join(root, 'www')) {
  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(outputDirectory, { recursive: true });
  files.forEach(file => cpSync(join(root, file), join(outputDirectory, file)));
  directories.forEach(directory => cpSync(join(root, directory), join(outputDirectory, directory), { recursive: true }));
  return outputDirectory;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = buildMobile();
  console.log(`Mobile web assets created at ${output}`);
}
