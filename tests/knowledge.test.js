import test from 'node:test';
import assert from 'node:assert/strict';
import { getReply } from '../src/knowledge.js';

test('explains current work from the supplied profile', () => {
  assert.match(getReply('你现在在做什么？'), /Agent/);
  assert.match(getReply('最近忙啥'), /求职/);
});

test('does not invent completed projects', () => {
  assert.match(getReply('你有哪些作品？'), /个人主页/);
  assert.match(getReply('你有哪些作品？'), /尚未提供/);
});

test('provides the confirmed GitHub identity without inventing email', () => {
  const reply = getReply('怎么联系你？');
  assert.match(reply, /github.com\/Rapeter/);
  assert.match(reply, /未提供/);
  assert.doesNotMatch(reply, /@/);
});

test('handles several supported topics in one message', () => {
  const reply = getReply('你现在在做什么？有哪些作品？怎么联系？');
  assert.match(reply, /Agent/);
  assert.match(reply, /尚未提供/);
  assert.match(reply, /github.com\/Rapeter/);
});

test('keeps unknown personal facts out of replies', () => {
  for (const question of ['你的电话号码是多少', '你的学校是哪所', '<img src=x onerror=alert(1)>', '今天的天气', '你喜欢什么球队']) {
    assert.match(getReply(question), /还没有/);
  }
});

test('describes interests and identity without adding facts', () => {
  assert.match(getReply('介绍一下你自己'), /学生/);
  assert.match(getReply('有什么爱好'), /足球/);
  assert.match(getReply('擅长什么'), /内容表达/);
});

test('handles empty and non-string inputs safely', () => {
  assert.match(getReply('  '), /想了解/);
  assert.match(getReply(null), /想了解/);
});
