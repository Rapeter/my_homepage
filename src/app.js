import { getReply } from './knowledge.js';

const messages = document.querySelector('#messages');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#question');
const sendButton = document.querySelector('#send');
const count = document.querySelector('#character-count');

function addMessage(text, role = 'assistant') {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  if (role === 'assistant') {
    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.textContent = 'z';
    avatar.setAttribute('aria-hidden', 'true');
    message.append(avatar);
  }
  const content = document.createElement('div');
  content.className = 'message-content';
  const author = document.createElement('p');
  author.className = 'message-author';
  author.textContent = role === 'assistant' ? 'Zhong 的数字分身' : '你';
  const bubble = document.createElement('p');
  bubble.className = 'bubble';
  // All visitor input is plain text, never interpreted as HTML.
  bubble.textContent = text;
  content.append(author, bubble);
  message.append(content);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function updateInput() {
  sendButton.disabled = !input.value.trim();
  count.textContent = `${input.value.length} / 500`;
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 102)}px`;
}

function resetChat() {
  messages.replaceChildren();
  addMessage('嗨！很高兴你来到这里 👋\n我是 Zhong 的数字分身。');
  addMessage('可以问我近况、作品或兴趣。\n目前，我会根据 Zhong 提供的资料回答。');
  input.value = '';
  updateInput();
  messages.scrollTop = 0;
}

function ask(question) {
  const text = question.trim().slice(0, 500);
  if (!text) return;
  addMessage(text, 'user');
  addMessage(getReply(text));
  input.value = '';
  updateInput();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  ask(input.value);
  input.focus();
});
input.addEventListener('input', updateInput);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    form.requestSubmit();
  }
});
document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => ask(button.dataset.question));
});
document.querySelector('#reset-chat').addEventListener('click', () => {
  resetChat();
  input.focus();
});
document.querySelector('#year').textContent = new Date().getFullYear();
resetChat();
