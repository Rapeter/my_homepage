// All data is preset: no live tools, model or network request runs here.
export const notes = [
  {id:'agent-loop',title:'执行循环',content:'一次执行循环包含：接收任务、选择动作、执行工具、读取返回结果，再判断是否需要继续。把当前步骤和已完成结果保存在任务状态里，并设置明确的完成条件和最大步数。'},
  {id:'tool-calls',title:'工具调用',content:'工具是有明确输入和输出的函数。模型可以提出工具名称与参数，由程序校验并执行，再将结果交回下一轮。搜索返回笔记标识，读取工具根据标识取得正文；仅看到搜索标题，还不足以整理正文。'},
  {id:'context',title:'上下文与停止条件',content:'每一步只装入当前任务需要的指令、任务状态、工具定义与证据。笔记和工具返回值作为资料处理。整理结果时保留来源；任务达到完成条件或用完步数预算时停止。'},
];
const items = [
  {text:'画出执行循环，记录每一步的任务状态。',source:notes[0]},
  {text:'定义搜索与读取工具的输入输出，区分检索结果和正文。',source:notes[1]},
  {text:'按需组织上下文，为结果保留来源，并设置停止条件。',source:notes[2]},
];
const toolStep = (title,description,name,input,output) => ({title,description,tool:{name,input,output}});
const receive = {title:'接收任务',description:'目标：从示例笔记整理一份 Agent 工程学习清单。完成条件：覆盖执行循环、工具调用和上下文，每一项都能找到对应来源。'};
const search = toolStep('搜索笔记','先找到相关标题与标识。搜索结果还不是笔记正文，下一步需要读取。','search_notes',{query:'Agent 执行循环 工具调用 上下文',limit:3},notes.map(({id,title})=>({id,title})));
const read = note => toolStep(`读取：${note.title}`,'根据标识读取正文，将成功返回的内容加入本次任务的资料。','read_note',{id:note.id},note);
const finish = [
  {title:'整理学习清单',description:'三份正文已经读取，整理为可实践的学习项，并保留来源。这是预先写好的示例结果。',draft:items.map(item=>item.text)},
  {title:'完成',description:'三项内容都有来源，达到完成条件后停止。这个情境展示 harness 对完成条件的检查。'},
];
export function getScenario(id) {
  if (id === 'budget') return {
    policy:'最多执行 3 步；预算耗尽后的停止说明另列。',
    steps:[receive,search,read(notes[0]),{title:'达到步数上限',description:'已经执行接收任务、搜索和读取共 3 步。剩余两份正文尚未读取，立即停止；保留已确认的部分结果，明确列出缺口，等待下一次执行。'}],
    result:{complete:false,title:'部分结果 · 任务未完成',summary:'只读取了「执行循环」。工具调用、上下文与停止条件的正文尚未读取，不能从搜索标题补写结论。',items:items.slice(0,1)},
  };
  if (id === 'retry') return {
    policy:'读取工具超时后最多重试 1 次；本例第二次读取成功。',
    steps:[receive,search,read(notes[0]),
      toolStep('读取失败：工具调用','收到 TIMEOUT 后先识别为可重试错误，暂不把错误信息当作笔记正文，也不继续生成清单。','read_note',{id:notes[1].id,attempt:1},{error:'TIMEOUT',retryable:true}),
      toolStep('重试读取：工具调用','在 1 次重试上限内再次读取，成功后才把正文加入资料。如果仍然失败，应停止并报告缺口。','read_note',{id:notes[1].id,attempt:2},notes[1]),
      read(notes[2]),...finish],
    result:{complete:true,title:'Agent 工程学习清单',summary:'一次超时后重试成功，三份正文均已读取。重试需要明确上限，避免无限循环。',items},
  };
  return {
    policy:'读取三份正文，核对来源后完成。',
    steps:[receive,search,...notes.map(read),...finish],
    result:{complete:true,title:'Agent 工程学习清单',summary:'三项内容都有对应来源，达到完成条件。',items},
  };
}
