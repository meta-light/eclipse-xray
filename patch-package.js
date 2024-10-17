import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'node_modules', '@solana', 'spl-type-length-value', 'lib', 'esm', 'splDiscriminate.js');

let content = fs.readFileSync(filePath, 'utf8');
content = content.replace("import { createHash } from 'crypto';", "import { createHash } from '../../../../../src/crypto-shim.js';");

fs.writeFileSync(filePath, content);