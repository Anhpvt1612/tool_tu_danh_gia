const status = document.querySelector('#status');
const processed = document.querySelector('#processed');
const skipped = document.querySelector('#skipped');
const statusDot = document.querySelector('.status-dot');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const reset = document.querySelector('#reset');

function showState(state) {
  status.textContent = state?.message || 'Chưa kết nối trang Viettel Post.';
  processed.textContent = state?.processed || 0;
  skipped.textContent = state?.skipped || 0;
  const running = Boolean(state?.running);
  statusDot.classList.toggle('running', running);
  statusDot.classList.toggle('done', Boolean(state && !running));
  start.disabled = running;
  stop.disabled = !running;
}

async function send(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return showState({ message: 'Không tìm thấy tab đang mở.' });
  chrome.tabs.sendMessage(tab.id, message, response => {
    if (chrome.runtime.lastError) {
      showState({ message: 'Hãy mở đúng trang Viettel Post rồi tải lại trang.' });
      return;
    }
    showState(response);
  });
}

start.addEventListener('click', () => {
  const delay = Math.max(500, Number(document.querySelector('#delay').value) || 1200);
  send({ type: 'VP_START', delay });
});
stop.addEventListener('click', () => send({ type: 'VP_STOP' }));
reset.addEventListener('click', () => send({ type: 'VP_RESET' }));
send({ type: 'VP_STATUS' });
