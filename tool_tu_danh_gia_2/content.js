(() => {
  if (window.__viettelPostAutoRateLoaded) return;
  window.__viettelPostAutoRateLoaded = true;

  const KEY = 'viettelPostAutoRateState';
  const state = {
    running: false,
    message: 'Sẵn sàng. Bấm Bắt đầu trong extension.',
    processed: 0,
    skipped: 0,
    delay: 1200,
    processedIds: new Set(),
    loop: null,
    freshStart: false
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const visible = el => el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const clean = value => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const text = el => clean(el?.textContent);

  function snapshot() {
    return {
      running: state.running,
      message: state.message,
      processed: state.processed,
      skipped: state.skipped
    };
  }

  function notify() {
    chrome.runtime.sendMessage({ type: 'VP_STATE', state: snapshot() }).catch(() => {});
  }

  function setMessage(message) {
    state.message = message;
    notify();
  }

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      state.processedIds = new Set(Array.isArray(saved.processedIds) ? saved.processedIds : []);
      state.processed = Number(saved.processed) || 0;
      state.skipped = Number(saved.skipped) || 0;
    } catch (_) {}
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify({
      processedIds: [...state.processedIds].slice(-5000),
      processed: state.processed,
      skipped: state.skipped
    }));
  }

  async function waitFor(getter, timeout = 10000, label = 'điều kiện') {
    const end = Date.now() + timeout;
    while (state.running && Date.now() < end) {
      const found = getter();
      if (found) return found;
      await sleep(150);
    }
    if (!state.running) throw new Error('Đã dừng');
    throw new Error(`Hết thời gian chờ ${label}`);
  }

  function visibleTextElement(root, phrase) {
    const wanted = clean(phrase);
    return [...root.querySelectorAll('button, a, label, [role="menuitem"], .mat-menu-item, div')]
      .find(el => visible(el) && clean(el.textContent) === wanted);
  }

  function findVisibleRatingModal() {
    const candidates = [...document.querySelectorAll('.modal, [role="dialog"], app-modal-evaluate-old-vtp')];
    const ratingInput = 'input#star5, input[name="rating"][value="5"]';
    const active = modal => modal && (
      visible(modal) || modal.classList.contains('show') ||
      modal.getAttribute('aria-modal') === 'true' || modal.style.display === 'block'
    );
    return candidates.find(modal => active(modal) && modal.querySelector(ratingInput)) ||
      [...document.querySelectorAll('#ratePostman500, #ratePostman, #ratePostmanReson')].find(active);
  }

  function orderIdFromRow(row) {
    const number = row.querySelector('[id^="row_order_number_"]');
    return clean(number?.textContent).replace(/\D/g, '') || `row-${[...document.querySelectorAll('tr')].indexOf(row)}`;
  }

  function currentOrderId() {
    return clean(document.querySelector('#ratePostman .txt-red')?.textContent).replace(/\D/g, '');
  }

  function clickElement(el) {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    el.click();
  }

  async function closeModal(selector) {
    const modal = document.querySelector(selector);
    if (!modal || !visible(modal)) return;
    const close = modal.querySelector('.close, .close-btn, [data-dismiss="modal"]');
    if (close) clickElement(close);
    await sleep(state.delay);
  }

  async function rateOne(row, id) {
    const bars = row.querySelectorAll('i.fa-bars');
    if (!bars.length) throw new Error('Không thấy nút thao tác');
    clickElement(bars[0].closest('button') || bars[0]);

    const menuItem = await waitFor(
      () => visibleTextElement(document.body, 'Thông tin bưu tá'),
      8000,
      'menu Thông tin bưu tá'
    );
    clickElement(menuItem);

    const courierModal = await waitFor(
      () => document.querySelector('#vtpBillModalPostmanOrderInformation.show, #vtpBillModalPostmanOrderInformation[aria-modal="true"]'),
      10000,
      'modal thông tin bưu tá'
    );
    const evaluate = courierModal.querySelector('.btnEvaluate button:not([disabled])') ||
      visibleTextElement(courierModal, 'Đánh giá');
    if (!evaluate) {
      await closeModal('#vtpBillModalPostmanOrderInformation');
      throw new Error('Đơn này không có nút Đánh giá (có thể đã đánh giá hoặc chưa đủ điều kiện)');
    }
    clickElement(evaluate);

    await sleep(400);
    const ratingModal = await waitFor(
      () => findVisibleRatingModal(),
      10000,
      'modal đánh giá'
    );
    const star = await waitFor(() => ratingModal.querySelector('input#star5, input[name="rating"][value="5"]'), 5000, 'sao 5');
    clickElement(ratingModal.querySelector(`label[for="${star.id}"]`) || star);
    star.checked = true;
    star.dispatchEvent(new Event('input', { bubbles: true }));
    star.dispatchEvent(new Event('change', { bubbles: true }));

    const submit = await waitFor(
      () => [...ratingModal.querySelectorAll('button[type="submit"], .btn-submit')].find(b => visible(b) && !b.disabled),
      5000,
      'nút Gửi đánh giá'
    );
    clickElement(submit);
    await sleep(state.delay);
    await closeModal('#ratePostmanThank');
    state.processedIds.add(id);
    state.processed += 1;
    save();
  }

  async function nextPage() {
    const next = document.querySelector('.mat-paginator-navigation-next');
    if (!next || next.disabled) return false;
    const before = [...document.querySelectorAll('[id^="row_order_number_"]')].map(e => text(e)).join('|');
    clickElement(next);
    await waitFor(() => {
      const after = [...document.querySelectorAll('[id^="row_order_number_"]')].map(e => text(e)).join('|');
      return after && after !== before;
    }, 10000, 'trang kế tiếp');
    return true;
  }

  async function run() {
    try {
      while (state.running) {
        const rows = [...document.querySelectorAll('tr[role="row"]')].filter(row => row.querySelector('i.fa-bars'));
        const row = rows.find(r => !state.processedIds.has(orderIdFromRow(r)));
        if (!row) {
          if (await nextPage()) continue;
          state.running = false;
          setMessage(state.skipped ? `Đã quét xong nhưng có ${state.skipped} đơn bị bỏ qua; xem lỗi gần nhất.` : 'Hoàn tất: không còn đơn chưa xử lý trên các trang.');
          break;
        }
        const id = orderIdFromRow(row);
        setMessage(`Đang xử lý đơn ${id}...`);
        try {
          await rateOne(row, id);
          setMessage(`Đã gửi đánh giá đơn ${id}.`);
        } catch (error) {
          if (!state.running) break;
          state.skipped += 1;
          state.processedIds.add(id);
          save();
          setMessage(`Bỏ qua đơn ${id}: ${error.message}`);
          await closeModal('#vtpBillModalPostmanOrderInformation');
          await closeModal('#ratePostman500');
          await closeModal('#ratePostmanThank');
        }
        await sleep(state.delay);
      }
    } catch (error) {
      state.running = false;
      setMessage(`Đã dừng do lỗi: ${error.message}`);
    } finally {
      state.loop = null;
      notify();
    }
  }

  function start(delay) {
    if (state.running) return;
    if (!state.freshStart) loadSaved();
    state.freshStart = false;
    state.delay = Math.max(500, Number(delay) || 1200);
    state.running = true;
    setMessage('Đang bắt đầu...');
    state.loop = run();
  }

  function stop() {
    state.running = false;
    setMessage('Đã yêu cầu dừng; sẽ dừng sau thao tác hiện tại.');
  }

  function reset() {
    if (state.running) return setMessage('Hãy Dừng trước khi xóa lịch sử.');
    localStorage.removeItem(KEY);
    state.processedIds.clear();
    state.processed = 0;
    state.skipped = 0;
    state.freshStart = true;
    setMessage('Đã xóa lịch sử. Có thể bấm Bắt đầu để chạy lại.');
  }

  loadSaved();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'VP_START') start(message.delay);
    if (message.type === 'VP_STOP') stop();
    if (message.type === 'VP_RESET') reset();
    if (message.type === 'VP_STATUS') sendResponse(snapshot());
    return message.type === 'VP_STATUS';
  });
})();
