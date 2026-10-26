// Shared by static generation and the browser. Only public rendered notes enter this index.
function plainText(html) {
  const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return html.replace(/<!--[\s\S]*?-->/g,'')
    .replace(/<\/?(?:p|h[1-6]|li|ul|ol|pre|blockquote|table|tr|td|th|thead|tbody|br|hr|div)\b[^>]*>/gi,' ')
    .replace(/<[^>]*>/g,'')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity)=>{
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()];
      const point=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):Number(entity.slice(1));
      return point>0 && point<=0x10ffff?String.fromCodePoint(point):' ';
    }).replace(/\s+/g,' ').trim();
}

export function indexSections(html) {
  const sections=[];
  let start=0, id='', title='';
  for (const match of html.matchAll(/<h[2-6] id="([^"]+)">([\s\S]*?)<\/h[2-6]>/g)) {
    const text=plainText(html.slice(start,match.index));
    if (text) sections.push({id,title,text});
    id=match[1]; title=plainText(match[2]); start=match.index;
  }
  const text=plainText(html.slice(start));
  if (text) sections.push({id,title,text});
  return sections;
}

const tokens = query => [...new Set(query.trim().slice(0,160).toLowerCase().split(/\s+/).filter(Boolean))];
function excerpt(text, terms) {
  const lower=text.toLowerCase();
  const positions=terms.map(term=>lower.indexOf(term)).filter(index=>index>=0);
  const first=positions.length?Math.min(...positions):0;
  const start=Math.max(0,first-55), end=Math.min(text.length,start+175);
  return `${start?'…':''}${text.slice(start,end)}${end<text.length?'…':''}`;
}

export function searchNotes(records, query) {
  const terms=tokens(query);
  if (!terms.length) return [];
  const hits=[];
  for (const record of records) {
    const title=record.title.toLowerCase();
    const tags=(record.tags || []).join(' ').toLowerCase();
    const description=(record.description || '').toLowerCase();
    const full=[title,tags,description,...record.sections.map(section=>section.text)].join(' ').toLowerCase();
    if (!terms.every(term=>full.includes(term))) continue;
    const sections=record.sections.map(section=>({
      ...section,
      score:terms.reduce((score,term)=>score+(section.text.toLowerCase().includes(term)?2:0)+(section.title.toLowerCase().includes(term)?8:0),0),
      excerpt:excerpt(section.text,terms),
    })).filter(section=>section.score>0).sort((a,b)=>b.score-a.score);
    const score=terms.reduce((score,term)=>score+(title.includes(term)?20:0)+(tags.includes(term)?5:0)+(description.includes(term)?2:0),0)+(sections[0]?.score || 0);
    hits.push({slug:record.slug,score,sections:sections.length?sections:[{id:'',title:'',excerpt:excerpt(record.description || record.sections[0]?.text || '',terms)}]});
  }
  return hits.sort((a,b)=>b.score-a.score);
}

// Return text fragments so the UI can use text nodes and <mark>, never innerHTML.
export function highlightParts(text, query) {
  const terms=tokens(query), parts=[], lower=text.toLowerCase();
  let cursor=0;
  while (cursor<text.length) {
    let position=-1, length=0;
    for (const term of terms) {
      const found=lower.indexOf(term,cursor);
      if (found>=0 && (position<0 || found<position || (found===position && term.length>length))) { position=found; length=term.length; }
    }
    if (position<0) { parts.push({text:text.slice(cursor),match:false}); break; }
    if (position>cursor) parts.push({text:text.slice(cursor,position),match:false});
    parts.push({text:text.slice(position,position+length),match:true});
    cursor=position+length;
  }
  return parts;
}
