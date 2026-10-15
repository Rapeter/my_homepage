import test from 'node:test';
import assert from 'node:assert/strict';
import { getScenario } from '../assets/agent-scenarios.js';

test('preset results only cite successfully read sources, including partial budget output', () => {
  for (const id of ['normal', 'retry', 'budget']) {
    const scenario = getScenario(id);
    const read = new Set(scenario.steps.filter(step => step.tool?.name === 'read_note' && step.tool.output.content).map(step => step.tool.output.id));
    for (const item of scenario.result.items) assert.equal(read.has(item.source.id), true, `${id}: result must have read evidence`);
    assert.equal(scenario.result.complete, read.size === 3);
  }
  const budget = getScenario('budget');
  assert.equal(budget.result.items.length, 1);
  assert.match(budget.result.title, /未完成/);
  assert.match(budget.result.summary, /尚未读取/);
});

test('timeout example retries the same note once before producing supported results', () => {
  const scenario = getScenario('retry');
  const failedIndex = scenario.steps.findIndex(step => step.tool?.output.error === 'TIMEOUT');
  assert.ok(failedIndex > 0);
  const failed = scenario.steps[failedIndex].tool;
  const retried = scenario.steps[failedIndex + 1].tool;
  assert.equal(retried.input.id, failed.input.id);
  assert.equal(retried.input.attempt, 2);
  assert.ok(retried.output.content);
  assert.equal(scenario.steps.filter(step => step.tool?.output.error).length, 1);
  assert.equal(scenario.result.complete, true);
});
