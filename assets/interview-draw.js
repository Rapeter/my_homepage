export function interviewQuestions(records) {
  return records.filter(record=>record.type==='interview').flatMap(record=>record.sections
    .filter(section=>/^q\d+(?:-\d+)?$/.test(section.id) && section.title)
    .map(section=>({href:`./${record.slug}/#${section.id}`,title:section.title,source:record.title})));
}

export function drawIndex(count, previous, random = Math.random) {
  if (!count) return -1;
  if (count===1) return 0;
  const skip = previous>=0 && previous<count;
  const index = Math.floor(random() * (count-Number(skip)));
  return skip && index>=previous ? index+1 : index;
}

export function mountInterviewDraw(root, records) {
  if (!root) return;
  const questions = interviewQuestions(records);
  if (!questions.length) return;
  const button = root.querySelector('button');
  const sticker = button.querySelector('img');
  const result = root.querySelector('.draw-result');
  const link = result.querySelector('a');
  const source = result.querySelector('.draw-source');
  const announcement = root.querySelector('[role="status"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let previous=-1, motion;
  button.addEventListener('click',()=>{
    previous=drawIndex(questions.length,previous);
    const question=questions[previous];
    link.href=question.href;
    link.textContent=question.title;
    source.textContent=`来自：${question.source}`;
    result.hidden=false;
    announcement.textContent=`抽到：${question.title}，来自${question.source}`;
    motion?.cancel();
    if (!reducedMotion.matches && sticker.animate) {
      motion=sticker.animate([
        {transform:'translateY(0) rotate(0)'},
        {transform:'translateY(-7px) rotate(-8deg)',offset:.45},
        {transform:'translateY(0) rotate(0)'},
      ],{duration:360,easing:'ease-out'});
    }
  });
  root.hidden=false;
}
