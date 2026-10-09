// V1 intentionally answers only from Zhong's supplied profile, without an API.
const topics = [
  {
    pattern: /现在.{0,6}(做|忙|学)|最近|近况|忙啥|在忙|agent|求职|找工作|面试|招聘/i,
    answer: '我最近在学习 Agent 相关内容和 AI 应用开发，同时准备求职。具体在做三件事：搭建个人网站、丰富简历、准备面试和招聘。希望把学到的东西一步步做成能用的作品。',
  },
  {
    pattern: /作品|项目|portfolio|projects?|做过|成果/i,
    answer: '目前正在搭建的作品就是你看到的这个个人主页：展示我的近况，并通过数字分身问答帮助大家了解我。其他作品的详细资料尚未提供，后续会补充经过确认的项目介绍和链接。',
  },
  {
    pattern: /联系|邮箱|邮件|微信|github|contact|email/i,
    answer: '你可以先通过 GitHub 找到我：github.com/Rapeter。主页下方也有 GitHub 入口。目前还未提供公开邮箱或微信；如果需要具体联系方式，请直接向 Zhong 确认。',
  },
  {
    pattern: /爱好|兴趣|喜欢做什么|平时.{0,4}(做|干)|hobb|interests?/i,
    answer: '我的兴趣是 AI 应用、足球、旅游、美食和 Rap。学习之外，也喜欢探索这些让生活更有意思的事情。',
  },
  {
    pattern: /擅长|关心|优势|特点|人话|表达|整理|方向/i,
    answer: '我擅长或关心的方向是内容表达、AI 应用和知识整理。比较有记忆点的特点是：喜欢把复杂问题讲成人话，让信息更容易被理解。',
  },
  {
    pattern: /你是谁|叫什么|名字|介绍|身份|学生|认识你|about|who are you/i,
    answer: '我是 Zhong，一个正在学习 AI 应用开发的学生，目前也在求职。我在学习 Agent 相关内容，关心内容表达、AI 应用和知识整理。很高兴你来这里认识我。',
  },
];

export function getReply(question) {
  if (typeof question !== 'string' || !question.trim()) {
    return '你想了解 Zhong 的哪一面？可以问问近况、作品、兴趣或联系方式。';
  }
  const normalized = question.trim().slice(0, 500);
  const matches = topics.filter(({ pattern }) => pattern.test(normalized));
  if (matches.length) return matches.map(({ answer }) => answer).join('\n\n');
  if (/^(你好|嗨|哈[啰喽罗]|hello|hi|hey)[!！。,.，\s]*$/i.test(normalized)) {
    return '嗨，很高兴认识你！我是 Zhong 的数字分身原型。你可以问我他最近在忙什么、有哪些作品，或者有什么兴趣。';
  }
  return '这部分资料我还没有，暂时无法替 Zhong 确认。你可以换个问题，问问他的近况、作品、兴趣或联系方式；其他细节需要由 Zhong 本人补充。';
}
