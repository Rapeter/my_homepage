import test from 'node:test';
import assert from 'node:assert/strict';

test('the draw links only to published interview question headings', async () => {
  const {interviewQuestions} = await import('../assets/interview-draw.js');
  const records = [
    {slug:'study',title:'学习笔记',sections:[{id:'q1',title:'练习题'}]},
    {slug:'interview',title:'技术一面',type:'interview',sections:[
      {id:'技术',title:'章节'}, {id:'q01',title:'问题一',text:'问题一 面试官的问题：解释一下。 我的回答（概括）：当时的表达。 面试官追问：为什么？'}, {id:'r01',title:'反问'},
      {id:'f01',title:'反馈'}, {id:'q02',title:'问题二',text:'问题二 实际回答与对话过程（概括）：没有回答出来。'},
    ]},
  ];
  assert.deepEqual(interviewQuestions(records),[
    {href:'./interview/#q01',title:'问题一',source:'技术一面',answer:'当时的表达。 面试官追问：为什么？',answerLabel:'当时回答'},
    {href:'./interview/#q02',title:'问题二',source:'技术一面',answer:'没有回答出来。',answerLabel:'当时回答'},
  ]);
});

test('self-test falls back to the labeled dialogue when no separate candidate answer exists', async () => {
  const {interviewQuestions}=await import('../assets/interview-draw.js');
  const [question]=interviewQuestions([{slug:'a',title:'面试',type:'interview',sections:[{id:'q1',title:'我的反问',text:'我的反问 我的提问：团队方向？ 面试官的回答：内部提效。'}]}]);
  assert.equal(question.answerLabel,'当时问答记录');
  assert.equal(question.answer,'我的提问：团队方向？ 面试官的回答：内部提效。');
});

test('reverse questions retain the interviewer counterquestion before later candidate replies', async () => {
  const {interviewQuestions}=await import('../assets/interview-draw.js');
  const dialogue='我的提问：团队做什么？ 面试官先反问：了解公司吗？ 我的回答：知道相关产品。 面试官的介绍：团队做内部提效。';
  const [question]=interviewQuestions([{slug:'a',title:'一面',type:'interview',sections:[{id:'q32',title:'我的反问：团队方向',text:'我的反问：团队方向 '+dialogue}]}]);
  assert.equal(question.answer,dialogue);
  assert.equal(question.answerLabel,'当时问答记录');
});

test('drawing again skips the previous question and handles empty and single-question pools', async () => {
  const {drawIndex} = await import('../assets/interview-draw.js');
  assert.equal(drawIndex(0,-1,()=>0),-1);
  assert.equal(drawIndex(1,0,()=>0),0);
  assert.equal(drawIndex(4,-1,()=>0.99),3);
  assert.equal(drawIndex(4,1,()=>0),0);
  assert.equal(drawIndex(4,1,()=>0.45),2);
  assert.equal(drawIndex(4,1,()=>0.99),3);
});
