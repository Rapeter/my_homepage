import {notes, getScenario} from './agent-scenarios.js';

const root = document.querySelector('[data-agent-demo]');
if (root) {
  const start = root.querySelector('#demo-start');
  const previous = root.querySelector('#demo-previous');
  const next = root.querySelector('#demo-next');
  const reset = root.querySelector('#demo-reset');
  const status = root.querySelector('#demo-status');
  const list = root.querySelector('#demo-steps');
  const detail = root.querySelector('#step-detail');
  const result = root.querySelector('#demo-result');
  const select = root.querySelector('#demo-scenario');
  const policy = root.querySelector('#demo-policy');
  let current = -1, scenario, rows;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  for (const note of notes) {
    const source = element('details');
    source.id = `source-${note.id}`;
    source.append(element('summary', note.title), element('p', note.content));
    root.querySelector('#demo-sources').append(source);
  }
  function chooseScenario() {
    scenario = getScenario(select.value);
    policy.textContent = scenario.policy;
    list.replaceChildren();
    rows = scenario.steps.map((step, index) => {
      const row = element('li');
      row.append(element('span', String(index + 1).padStart(2, '0'), 'step-number'), element('span', step.title));
      list.append(row);
      return row;
    });
    current = -1;
    root.querySelectorAll('#demo-sources details').forEach(source => { source.open = false; });
    result.replaceChildren();
    render();
  }
  function renderResult() {
    result.replaceChildren();
    const heading = element('h2', scenario.result.title); heading.id = 'result-heading';
    result.append(heading, element('p', scenario.result.summary));
    const items = element('ol');
    scenario.result.items.forEach(item => {
      const row = element('li', item.text);
      const link = element('a', `来源：${item.source.title}`);
      link.href = `#source-${item.source.id}`;
      link.dataset.source = `source-${item.source.id}`;
      row.append(link); items.append(row);
    });
    result.append(items);
  }
  function render() {
    const steps = scenario.steps;
    start.hidden = current !== -1;
    previous.hidden = next.hidden = reset.hidden = current === -1;
    previous.disabled = current <= 0;
    next.disabled = current === steps.length - 1;
    result.hidden = current !== steps.length - 1;
    if (!result.hidden) renderResult();
    rows.forEach((row, index) => {
      row.classList.toggle('is-current', index === current);
      row.classList.toggle('is-complete', index < current);
      if (index === current) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    detail.replaceChildren();
    if (current === -1) {
      status.textContent = `尚未开始 · ${steps.length} 个步骤`;
      detail.append(element('h2', '看看一个任务如何完成'), element('p', '选择一种情境，点击“开始演示”。可以回看上一步，也可以随时切换情境重新开始。'));
      return;
    }
    const step = steps[current];
    status.textContent = `步骤 ${current + 1} / ${steps.length} · ${step.title}`;
    detail.append(element('h2', step.title), element('p', step.description));
    if (step.tool) {
      detail.append(element('h3', '工具调用'), element('code', step.tool.name, 'tool-name'));
      for (const [label, value] of [['输入参数', step.tool.input], ['返回内容', step.tool.output]]) {
        const pre = element('pre');
        pre.append(element('code', JSON.stringify(value, null, 2)));
        detail.append(element('h3', label), pre);
      }
    }
    if (step.draft) {
      const draft = element('ol');
      step.draft.forEach(item => draft.append(element('li', item)));
      detail.append(draft);
    }
  }
  select.addEventListener('change', chooseScenario);
  start.addEventListener('click', () => { current = 0; render(); next.focus(); });
  previous.addEventListener('click', () => { if (current > 0) { current--; render(); } });
  next.addEventListener('click', () => { if (current >= 0 && current < scenario.steps.length - 1) { current++; render(); } });
  reset.addEventListener('click', () => { chooseScenario(); start.focus(); });
  result.addEventListener('click', event => {
    const link = event.target.closest('a[data-source]');
    if (!link) return;
    event.preventDefault();
    const source = document.getElementById(link.dataset.source);
    source.open = true;
    source.scrollIntoView({ block:'center' });
    source.querySelector('summary').focus({ preventScroll:true });
  });
  root.querySelector('.demo-controls').hidden = false;
  root.querySelector('.demo-scenarios').hidden = false;
  chooseScenario();
}
