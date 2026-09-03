import { runAutoTests } from './test-runner.js';
import { runSimulationAssertions } from '../simulation/simulation-engine.js';

const step15 = runAutoTests();
const step17 = runSimulationAssertions();

const report = {
  suite: 'CHOCO_AUTO_STEP_18',
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  step15: {
    passed: step15.passed,
    passed_count: step15.passed_count,
    failed_count: step15.failed_count,
    results: step15.results,
  },
  step17: {
    passed: step17.passed,
    checks: step17.checks,
    execution_count: step17.result.execution_count,
  },
};

const safe =
  report.production_data_used === false &&
  report.production_write_permitted === false &&
  report.push_or_onesignal_used === false &&
  report.step15.passed &&
  report.step17.passed &&
  report.step17.execution_count === 0;

console.log(JSON.stringify({ ...report, passed: safe }, null, 2));

if (!safe) process.exit(1);
