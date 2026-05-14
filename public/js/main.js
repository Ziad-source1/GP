// ============================================================
// LEVEL UP — Main JS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Flash auto-dismiss
  document.querySelectorAll('.alert').forEach(el => {
    setTimeout(() => el.style.opacity = '0', 4000);
    setTimeout(() => el.remove(), 4500);
  });

  // ── Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // ── Sidebar mobile toggle
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // ── Active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a, .sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  // ── Progress bars animate on load
  document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
    const w = bar.getAttribute('data-width');
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = w; }, 200);
  });

  // ── Streak dots animate
  document.querySelectorAll('.streak-dot').forEach((dot, i) => {
    dot.style.transitionDelay = `${i * 0.05}s`;
  });

  // ── Range inputs with live display
  document.querySelectorAll('input[type=range]').forEach(range => {
    const display = document.querySelector(`[data-range="${range.id}"]`);
    if (display) {
      display.textContent = range.value;
      range.addEventListener('input', () => { display.textContent = range.value; });
    }
  });

  // ── Listing card hover glow
  document.querySelectorAll('.listing-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, #131C28, #111820)`;
    });
    card.addEventListener('mouseleave', () => { card.style.background = ''; });
  });

  // ── Number count animation
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = Math.floor(start).toLocaleString() + suffix;
      if (start >= target) clearInterval(timer);
    }, 16);
  });

  // ── Chat demo
  const chatInput = document.querySelector('.chat-input input');
  const chatSend = document.querySelector('.chat-input button');
  const chatMessages = document.querySelector('.chat-messages');
  if (chatInput && chatSend && chatMessages) {
    const send = () => {
      const msg = chatInput.value.trim();
      if (!msg) return;
      const div = document.createElement('div');
      div.className = 'chat-msg sent animate-fade-up';
      div.innerHTML = `<div class="chat-bubble">${msg}</div><div class="chat-time">Just now</div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput.value = '';
      setTimeout(() => {
        const resp = document.createElement('div');
        resp.className = 'chat-msg recv animate-fade-up';
        resp.innerHTML = `<div class="chat-bubble">Thanks for your message! I'll deliver shortly. ✅</div><div class="chat-time">Just now</div>`;
        chatMessages.appendChild(resp);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1200);
    };
    chatSend.addEventListener('click', send);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  // ── File upload preview
  document.querySelectorAll('.file-upload input[type=file]').forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const parent = input.closest('.file-upload');
      const text = parent.querySelector('.file-upload-text');
      if (text) text.innerHTML = `<strong>${file.name}</strong> selected ✓`;
      parent.style.borderColor = 'var(--green)';
    });
  });

  // ── Copy to clipboard
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 1500);
      });
    });
  });

  // ── Tabs
  document.querySelectorAll('.tab-nav').forEach(nav => {
    const tabs = nav.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(p => {
          p.classList.toggle('hidden', p.getAttribute('data-pane') !== target);
        });
      });
    });
  });

  // ── Category card colors
  const catColors = {
    currency: '#00FF88', accounts: '#D4AF37', topups: '#00CFFF',
    items: '#FF6B6B', boosting: '#A855F7', giftcards: '#F59E0B'
  };
  document.querySelectorAll('.category-card[data-cat]').forEach(card => {
    const cat = card.getAttribute('data-cat');
    const color = catColors[cat] || '#00FF88';
    card.addEventListener('mouseenter', () => { card.style.borderColor = color; card.style.boxShadow = `0 0 20px ${color}20`; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = ''; card.style.boxShadow = ''; });
  });

  // ── Quantity selector
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.qty-wrap').querySelector('input');
      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || 999;
      let val = parseInt(input.value) || 1;
      if (btn.classList.contains('qty-minus')) val = Math.max(min, val - 1);
      if (btn.classList.contains('qty-plus')) val = Math.min(max, val + 1);
      input.value = val;
      input.dispatchEvent(new Event('input'));
    });
  });

  // ── Price updater in checkout
  const qtyInput = document.querySelector('#qty-input');
  const priceDisplay = document.querySelector('#total-price');
  const basePrice = document.querySelector('#base-price');
  if (qtyInput && priceDisplay && basePrice) {
    qtyInput.addEventListener('input', () => {
      const qty = parseInt(qtyInput.value) || 1;
      const price = parseFloat(basePrice.value);
      priceDisplay.textContent = (qty * price).toLocaleString() + ' EGP';
    });
  }

});
document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
  const avatar = dropdown.querySelector('.nav-avatar');
  const menu = dropdown.querySelector('.nav-dropdown-menu');

  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
  });
});