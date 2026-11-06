import test from 'node:test';
import assert from 'node:assert/strict';

test('the draw links only to published interview question headings', async () => {
  const {interviewQuestions} = await import('../assets/interview-draw.js');
  const records = [
    {slug:'study',title:'学习笔记',sections:[{id:'q1',title:'练习题'}]},
    {slug:'interview',title:'技术一面',type:'interview',sections:[
      {id:'技术',title:'章节'}, {id:'q01',title:'问题一'}, {id:'r01',title:'反问'},
      {id:'f01',title:'反馈'}, {id:'q02',title:'问题二'},
    ]},
  ];
  assert.deepEqual(interviewQuestions(records),[
    {href:'./interview/#q01',title:'问题一',source:'技术一面'},
    {href:'./interview/#q02',title:'问题二',source:'技术一面'},
  ]);
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
