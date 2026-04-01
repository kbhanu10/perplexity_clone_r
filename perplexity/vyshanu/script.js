// DOM Elements
const cookieBanner = document.getElementById('cookieBanner');
const closeCookie = document.getElementById('closeCookie');
const chatMessages = document.getElementById('chatMessages');
const welcomeContainer = document.getElementById('welcomeContainer');
const searchInput = document.querySelector('.search-input');
const searchBox = document.querySelector('.search-box');
const centralArea = document.getElementById('centralArea');

let chatHistory = [];
let isWaiting = false;

// Cookie Banner
if (closeCookie) {
    closeCookie.addEventListener('click', () => {
        cookieBanner.style.animation = 'slideDown 0.3s ease-in forwards';
        setTimeout(() => { cookieBanner.style.display = 'none'; }, 300);
    });
}

// Input Focus Effects
searchInput.addEventListener('focus', () => {
    searchBox.style.boxShadow = '0 0 0 1px rgba(91, 156, 246, 0.3)';
    searchBox.style.borderColor = 'rgba(91, 156, 246, 0.2)';
});

searchInput.addEventListener('blur', () => {
    searchBox.style.boxShadow = 'none';
    searchBox.style.borderColor = 'transparent';
});

// Simple markdown to HTML converter
function renderMarkdown(text) {
    let html = text;

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="lang-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Line breaks (double newline = paragraph)
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph
    html = '<p>' + html + '</p>';

    // Clean up empty tags
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[2-4]>)/g, '$1');
    html = html.replace(/(<\/h[2-4]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');

    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Send Message
async function sendMessage() {
    const message = searchInput.value.trim();
    if (!message || isWaiting) return;

    isWaiting = true;
    searchInput.value = '';

    // Hide welcome, show chat
    if (welcomeContainer.style.display !== 'none') {
        welcomeContainer.style.display = 'none';
    }

    // User bubble
    appendMessage('user', message);

    // Loading indicator
    const loadingId = addLoadingIndicator();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: chatHistory
            }),
        });

        const data = await response.json();
        removeLoadingIndicator(loadingId);

        if (data.response) {
            appendMessage('assistant', data.response);
            chatHistory.push({ role: 'user', content: message });
            chatHistory.push({ role: 'assistant', content: data.response });
        } else if (data.error) {
            appendMessage('assistant', '⚠️ Error: ' + data.error);
        }
    } catch (error) {
        removeLoadingIndicator(loadingId);
        appendMessage('assistant', '⚠️ Failed to connect to the server. Make sure the Flask server is running.');
        console.error('Error:', error);
    } finally {
        isWaiting = false;
        searchInput.focus();
    }
}

function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    if (role === 'assistant') {
        messageDiv.innerHTML = renderMarkdown(text);
    } else {
        messageDiv.textContent = text;
    }

    chatMessages.appendChild(messageDiv);

    // Smooth scroll
    requestAnimationFrame(() => {
        centralArea.scrollTo({
            top: centralArea.scrollHeight,
            behavior: 'smooth'
        });
    });
}

function addLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = id;
    loadingDiv.className = 'message assistant-message loading-dots';
    loadingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatMessages.appendChild(loadingDiv);
    centralArea.scrollTo({ top: centralArea.scrollHeight, behavior: 'smooth' });
    return id;
}

function removeLoadingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// File Upload
const fileInput = document.getElementById('fileInput');
const attachBtn = document.getElementById('attachBtn');
const fileStatus = document.getElementById('fileStatus');
const fileNameSpan = document.getElementById('fileName');

if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        fileNameSpan.textContent = 'Uploading ' + file.name + '...';
        fileStatus.style.display = 'flex';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.status === 'Success') {
                fileNameSpan.textContent = '📎 ' + file.name;
                fileStatus.classList.add('loaded');
            } else {
                alert('Upload failed: ' + data.error);
                fileStatus.style.display = 'none';
            }
        } catch (error) {
            alert('Error uploading file. Make sure the Flask server is running.');
            fileStatus.style.display = 'none';
        }
    });
}

// New Chat button
const newChatBtn = document.querySelector('.new-chat');
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        chatHistory = [];
        chatMessages.innerHTML = '';
        welcomeContainer.style.display = 'flex';
        if (fileStatus) {
            fileStatus.style.display = 'none';
            fileStatus.classList.remove('loaded');
        }
        searchInput.focus();
    });
}

// Event Listeners
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Add CSS for markdown rendering and slideDown animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
    }
    .assistant-message h2, .assistant-message h3, .assistant-message h4 {
        margin: 12px 0 6px;
        font-weight: 600;
    }
    .assistant-message h2 { font-size: 18px; }
    .assistant-message h3 { font-size: 16px; }
    .assistant-message h4 { font-size: 15px; }
    .assistant-message p {
        margin-bottom: 8px;
        line-height: 1.65;
    }
    .assistant-message ul, .assistant-message ol {
        margin: 8px 0;
        padding-left: 20px;
    }
    .assistant-message li {
        margin-bottom: 4px;
        line-height: 1.55;
    }
    .assistant-message pre {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 10px;
        padding: 14px 16px;
        margin: 10px 0;
        overflow-x: auto;
        font-size: 13px;
        line-height: 1.5;
    }
    .assistant-message code {
        font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
        font-size: 13px;
    }
    .assistant-message .inline-code {
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
    }
    .assistant-message strong {
        font-weight: 600;
        color: #f0f0f0;
    }
    .assistant-message em {
        font-style: italic;
        color: #d0d0d0;
    }
`;
document.head.appendChild(style);
