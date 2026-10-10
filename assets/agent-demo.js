// All events and results are preset examples, replayed locally without a model.
const notes = [
  { id: 'agent-loop', title: '执行循环', content: '一次执行循环包含：接收任务、选择动作、执行工具、读取返回结果，再判断是否需要继续。把当前步骤和已完成结果保存在任务状态里，并设置明确的完成条件和最大步数。' },
  { id: 'tool-calls', title: '工具调用', content: '工具是有明确输入和输出的函数。模型可以提出工具名称与参数，由程序校验并执行，再将结果交回下一轮。搜索返回笔记标识，读取工具根据标识取得正文；仅看到搜索标题，还不足以整理正文。' },
  { id: 'context', title: '上下文与停止条件', content: '每一步只装入当前任务需要的指令、任务状态、工具定义与证据。笔记和工具返回值作为资料处理。整理结果时保留来源；任务达到完成条件或用完步数预算时停止。' },
];
const toolStep = (title, description, name, input, output) => ({ title, description, tool: { name, input, output } });
const steps = [
  { title: '接收任务', description: '目标：从示例笔记整理一份 Agent 工程学习清单。完成条件：覆盖执行循环、工具调用和上下文，每一项都能找到对应来源。' },
  toolStep('搜索笔记', '先找到可能相关的笔记，取得标识与标题。搜索结果用于选择接下来需要读取的资料。', 'search_notes', { query: 'Agent 执行循环 工具调用 上下文', limit: 3 }, notes.map(({ id, title }) => ({ id, title }))),
  ...notes.map(note => toolStep(`读取：${note.title}`, '根据搜索返回的标识读取正文，将这份工具结果加入本次任务的资料。', 'read_note', { id: note.id }, note)),
  { title: '整理学习清单', description: '把三份笔记分别整理为可实践的学习项，保留来源标识。此步骤展示预先写好的整理结果。', draft: ['画出执行循环，记录每一步的任务状态。', '定义搜索与读取工具的输入输出，区分检索结果和正文。', '按需组织上下文，为结果保留来源，并设置停止条件。'] },
  { title: '完成', description: '三项学习内容都有对应笔记，达到这个案例的完成条件，演示结束。你可以点开来源核对原文，也可以回看前面的工具调用。' },
];

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
  let current = -1;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const rows = steps.map((step, index) => {
    const row = element('li');
    row.append(element('span', String(index + 1).padStart(2, '0'), 'step-number'), element('span', step.title));
    list.append(row);
    return row;
  });
  for (const note of notes) {
    const source = document.createElement('details');
    source.id = `source-${note.id}`;
    source.append(element('summary', note.title), element('p', note.content));
    root.querySelector('#demo-sources').append(source);
  }
  function render() {
    start.hidden = current !== -1;
    previous.hidden = next.hidden = reset.hidden = current === -1;
    previous.disabled = current <= 0;
    next.disabled = current === steps.length - 1;
    result.hidden = current !== steps.length - 1;
    rows.forEach((row, index) => {
      row.classList.toggle('is-current', index === current);
      row.classList.toggle('is-complete', index < current);
      if (index === current) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    detail.replaceChildren();
    if (current === -1) {
      status.textContent = '尚未开始 · 7 个步骤';
      detail.append(element('h2', '看看一个任务如何完成'), element('p', '点击“开始演示”，跟随搜索、读取和整理的过程。你可以随时回到上一步。'));
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
  start.addEventListener('click', () => { current = 0; render(); next.focus(); });
  previous.addEventListener('click', () => { if (current > 0) { current--; render(); } });
  next.addEventListener('click', () => { if (current >= 0 && current < steps.length - 1) { current++; render(); } });
  reset.addEventListener('click', () => {
    current = -1;
    root.querySelectorAll('#demo-sources details').forEach(source => { source.open = false; });
    render(); start.focus();
  });
  result.addEventListener('click', event => {
    const link = event.target.closest('a[data-source]');
    if (!link) return;
    event.preventDefault();
    const source = document.getElementById(link.dataset.source);
    source.open = true;
    source.scrollIntoView({ block: 'center' });
    source.querySelector('summary').focus({ preventScroll: true });
  });
  root.querySelector('.demo-controls').hidden = false;
  render();
}
