const socket = io();

let username = '';
let isTyping = false;
let typingTimer;

// DOM Elements
const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const userList = document.getElementById('userList');
const userCount = document.getElementById('userCount');
const typingIndicator = document.getElementById('typingIndicator');

// Join chat when username is entered
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && usernameInput.value.trim()) {
    joinChat();
  }
});

function joinChat() {
  username = usernameInput.value.trim();
  if (username) {
    socket.emit('join', username);
    usernameInput.disabled = true;
    usernameInput.style.opacity = '0.5';
    messageInput.focus();
  }
}

// Send message
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && username) {
    socket.emit('chatMessage', message);
    messageInput.value = '';
  }
}

// Typing indicators
messageInput.addEventListener('input', () => {
  if (username) {
    const typing = messageInput.value.trim().length > 0;
    if (typing !== isTyping) {
      isTyping = typing;
      socket.emit('typing', isTyping);
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', false);
      isTyping = false;
    }, 1000);
  }
});

// Socket event listeners
socket.on('previousMessages', (prevMessages) => {
  prevMessages.forEach(addMessage);
});

socket.on('message', addMessage);

socket.on('userJoined', (user) => {
  addSystemMessage(`${user} joined the chat`);
});

socket.on('userLeft', (user) => {
  addSystemMessage(`${user} left the chat`);
});

socket.on('userList', (users) => {
  updateUserList(users);
  userCount.textContent = users.length;
});

socket.on('userTyping', ({ username: typer, isTyping }) => {
  if (isTyping) {
    typingIndicator.textContent = `${typer} is typing...`;
  } else {
    typingIndicator.textContent = '';
  }
});

// UI Functions
function addMessage(msg) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  
  const time = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-avatar">${getAvatarInitials(msg.username)}</div>
      <div class="message-bubble">
        <div class="message-header">
          <span class="message-username">${escapeHtml(msg.username)}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(msg.message)}</div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    text-align: center;
    margin: 15px 0;
    color: #6c757d;
    font-style: italic;
    font-size: 14px;
  `;
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateUserList(users) {
  userList.innerHTML = users.map(user => 
    `<li>${escapeHtml(user)}</li>`
  ).join('');
}

function getAvatarInitials(name) {
  return name.charAt(0).toUpperCase();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-join if username already set (for testing)
if (localStorage.getItem('chatUsername')) {
  usernameInput.value = localStorage.getItem('chatUsername');
  joinChat();
}
