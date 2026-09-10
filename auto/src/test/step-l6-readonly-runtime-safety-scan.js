// CHOCO AUTO LAB — static fail-closed scan for live runtime files
// Prevents accidental mutation methods from entering the read-only runtime.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const liveDir = path.resolve(here, '../live');
const files = fs.readdirSync(liveDir).filter((name) => name.endsWith('.js')).sort();

const forbiddenMutationCalls = /\.(insert|update|delete|upsert|rpc)\s*\(/;
const forbiddenWriteFetch = /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i;
const unsafeFlag = /PRODUCTION_(?:EXECUTION_ENABLED|WRITE_PERMITTED)\s*=\s*true|DATABASE_MUTATION_PERMITTED\s*=\s*true|PUSH_OR_ONESIGNAL_PERMITTED\s*=\s*true/;

const violations = [];
for (const name of files) {
  const file = path.join(liveDir, name);
  const source = fs.readFileSync(file, 'utf8');
  if (forbiddenMutationCalls.test(source)) violations.push(`${name}: mutation API call`);
  if (forbiddenWriteFetch.test(source)) violations.push(`${name}: mutating HTTP method`);
  if (unsafeFlag.test(source)) violations.push(`${name}: unsafe production flag`);
}

if (violations.length) throw new Error(`Read-only runtime safety scan failed: ${violations.join('; ')}`);
console.log(`CHOCO_AUTO_LEVEL_6_READONLY_RUNTIME_SAFETY_SCAN: PASS (${files.length} files)`);
