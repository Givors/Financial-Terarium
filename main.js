// JavaScript Logic - Greenhouse Finance & Garden

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Dark Mode Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
    renderChart();
  });

  // Background Leaf Animation
  initLeafCanvas();

  // Auto-Format Nominal Input with Dots (e.g., 5.500 or 12.200)
  const amountInput = document.getElementById('amountInput');
  amountInput.addEventListener('input', (e) => {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue) {
      e.target.value = parseInt(rawValue, 10).toLocaleString('id-ID');
    } else {
      e.target.value = '';
    }
  });

  // App State & LocalStorage
  let transactions = JSON.parse(localStorage.getItem('gh_transactions')) || [];
  let selectedFlower = localStorage.getItem('gh_flower') || 'mawar';
  let currentFilter = 'hari';

  const stages = {
    mawar: ['🌱', '🌿', '🪻', '🌹'],
    matahari: ['🌱', '🌿', '☘️', '🌻']
  };

  const stageNames = ['Benih', 'Tunas', 'Kuncup', 'Mekar Sempurna'];

  // Convert Formatted String Back to Integer
  function parseCurrency(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, ''), 10) || 0;
  }

  // Calculate Net Savings Amount
  function calculateSavings() {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'nabung') return acc + curr.amount;
      return acc;
    }, 0);
  }

  // Update Flower Growth & UI
  window.updateGardenUI = function(previewLevel = null) {
    const savings = calculateSavings();
    const actualLevel = Math.min(Math.floor(savings / 10000), 3);
    const activeLevel = previewLevel !== null ? previewLevel : actualLevel;

    document.getElementById('flowerVisual').innerText = stages[selectedFlower][activeLevel];
    document.getElementById('flowerStageText').innerText = 
      `Tahap: ${stageNames[activeLevel]} (Level ${activeLevel})`;

    document.getElementById('savingsDisplay').innerText = `Rp ${savings.toLocaleString('id-ID')}`;
    
    const currentTierProgress = (savings % 10000) / 10000 * 100;
    const progressPercent = actualLevel >= 3 ? 100 : Math.round(currentTierProgress);
    
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    document.getElementById('targetPercent').innerText = `${progressPercent}%`;
  };

  // Change Active Flower
  window.setFlowerType = function(type) {
    selectedFlower = type;
    localStorage.setItem('gh_flower', type);

    document.getElementById('btnMawar').classList.toggle('active', type === 'mawar');
    document.getElementById('btnMatahari').classList.toggle('active', type === 'matahari');
    updateGardenUI();
  };

  // Try On Simulation Controls
  window.toggleTryOn = function() {
    document.getElementById('tryOnBar').classList.toggle('hidden');
  };
  window.previewStage = function(lvl) { updateGardenUI(lvl); };
  window.resetPreview = function() { updateGardenUI(null); };

  // Form Submit Handler
  document.getElementById('financeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('typeInput').value;
    const amountStr = document.getElementById('amountInput').value;
    const amount = parseCurrency(amountStr);
    const note = document.getElementById('noteInput').value.trim() || '-';

    if (!amount || amount <= 0) return;

    const newTx = {
      id: Date.now(),
      type,
      amount,
      note,
      date: new Date().toISOString()
    };

    transactions.push(newTx);
    localStorage.setItem('gh_transactions', JSON.stringify(transactions));
    
    document.getElementById('amountInput').value = '';
    document.getElementById('noteInput').value = '';
    
    updateGardenUI();
    renderChart();
    renderHistoryTable();
  });

  // Render Transaction History
  function renderHistoryTable() {
    const tbody = document.getElementById('transactionHistory');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-subtle); padding: 15px;">Belum ada catatan transaksi.</td></tr>`;
      return;
    }

    [...transactions].reverse().forEach((tx) => {
      const tr = document.createElement('tr');
      const dateFormatted = new Date(tx.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });

      let badgeClass = 'badge-nabung';
      let typeLabel = 'Tabungan';
      if (tx.type === 'pemasukan') { badgeClass = 'badge-pemasukan'; typeLabel = 'Pemasukan'; }
      if (tx.type === 'pengeluaran') { badgeClass = 'badge-pengeluaran'; typeLabel = 'Pengeluaran'; }

      tr.innerHTML = `
        <td style="color: var(--text-subtle);">${dateFormatted}</td>
        <td><span class="badge-tag ${badgeClass}">${typeLabel}</span></td>
        <td><strong>${tx.note}</strong></td>
        <td style="text-align: right; font-weight: 700;">Rp ${tx.amount.toLocaleString('id-ID')}</td>
        <td style="text-align: center;">
          <button onclick="deleteTransaction(${tx.id})" class="btn-reset" style="padding: 2px 8px; font-size: 10px;">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('gh_transactions', JSON.stringify(transactions));
    updateGardenUI();
    renderChart();
    renderHistoryTable();
  };

  window.clearAllTransactions = function() {
    if (confirm('Yakin ingin menghapus semua catatan keuangan?')) {
      transactions = [];
      localStorage.setItem('gh_transactions', JSON.stringify(transactions));
      updateGardenUI();
      renderChart();
      renderHistoryTable();
    }
  };

  // Render Chart.js
  let chartInstance = null;
  function renderChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    if (chartInstance) chartInstance.destroy();

    const savings = calculateSavings();
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mulai', 'Target Rp10k', 'Target Rp20k', 'Target Rp30k (Max)'],
        datasets: [{
          label: 'Total Tabungan (Rp)',
          data: [0, Math.min(savings, 10000), Math.min(savings, 20000), savings],
          borderColor: '#47b067',
          backgroundColor: isDark ? 'rgba(71, 176, 103, 0.15)' : 'rgba(71, 176, 103, 0.25)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#255b37',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          x: { 
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }

  window.updateFilter = function(period) {
    currentFilter = period;
    ['Hari', 'Bulan', 'Tahun'].forEach(p => {
      const btn = document.getElementById(`btn${p}`);
      if (btn) btn.classList.toggle('active', p.toLowerCase() === period);
    });
  };

  // Leaf Floating Animation Canvas
  function initLeafCanvas() {
    const canvas = document.getElementById('leafCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Leaf {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20 - Math.random() * 50;
        this.size = 8 + Math.random() * 12;
        this.speedY = 0.5 + Math.random() * 1.2;
        this.speedX = Math.sin(Math.random() * Math.PI * 2) * 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.03;
        this.opacity = 0.3 + Math.random() * 0.5;
        this.hue = 120 + Math.random() * 40;
        this.saturation = 35 + Math.random() * 30;
        this.lightness = 45 + Math.random() * 25;
      }
      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.015) * 0.8 + this.speedX;
        this.angle += this.spinSpeed;
        if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) this.reset();
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        const isDark = document.documentElement.classList.contains('dark');
        const lightness = isDark ? this.lightness + 10 : this.lightness;
        ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${lightness}%)`;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size * 0.6, -this.size * 0.2, 0, this.size);
        ctx.quadraticCurveTo(-this.size * 0.6, -this.size * 0.2, 0, -this.size);
        ctx.fill();
        ctx.restore();
      }
    }

    const leaves = Array.from({ length: 35 }, () => new Leaf());
    function animateLeaves() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves.forEach(leaf => { leaf.update(); leaf.draw(); });
      requestAnimationFrame(animateLeaves);
    }
    animateLeaves();
  }

  // Initial Load Call
  setFlowerType(selectedFlower);
  renderChart();
  renderHistoryTable();
});