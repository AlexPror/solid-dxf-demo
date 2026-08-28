(function () {
  'use strict';

  const TARGET_PAYBACK = 7;

  const ids = [
    'runs', 'rowsTyp', 'rowsPeak', 'peakShare',
    'hoursManualTyp', 'hoursManualPeak', 'hoursAutoTyp', 'hoursAutoPeak',
    'hourlyRate', 'projectCost'
  ];

  const rangeIds = ['runs', 'rowsTyp', 'rowsPeak', 'peakShare'];

  function fmt(n) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(n));
  }

  function readNum(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  function calc() {
    const runs = readNum('runs');
    const peakShare = readNum('peakShare') / 100;
    const typShare = 1 - peakShare;

    const hManTyp = readNum('hoursManualTyp');
    const hManPeak = readNum('hoursManualPeak');
    const hAutoTyp = readNum('hoursAutoTyp');
    const hAutoPeak = readNum('hoursAutoPeak');
    const rate = readNum('hourlyRate');
    const cost = readNum('projectCost');

    const saveTyp = Math.max(0, hManTyp - hAutoTyp);
    const savePeak = Math.max(0, hManPeak - hAutoPeak);

    const hoursMonth = runs * (typShare * saveTyp + peakShare * savePeak);
    const savingsMonth = hoursMonth * rate;

    const payback = savingsMonth > 0 ? cost / savingsMonth : Infinity;
    const maxPrice = savingsMonth * TARGET_PAYBACK;
    const costPerRun = runs > 0 ? cost / (runs * 12) : 0;

    document.getElementById('savingsMonth').textContent = fmt(savingsMonth);
    document.getElementById('payback').textContent =
      payback === Infinity ? '—' : payback.toFixed(1);
    document.getElementById('maxPrice').textContent = fmt(maxPrice);
    document.getElementById('costPerRun').textContent = fmt(costPerRun);

    const verdict = document.getElementById('calcVerdict');
    if (payback <= TARGET_PAYBACK) {
      verdict.textContent =
        'При введённых параметрах окупаемость укладывается в целевые ' +
        TARGET_PAYBACK + ' мес.';
      verdict.className = 'calc-note ok';
    } else if (payback < 24) {
      verdict.textContent =
        'Окупаемость ' + payback.toFixed(1) + ' мес — обсудить график оплаты или уточнить часы на пиковых пакетах 100–200 позиций.';
      verdict.className = 'calc-note warn';
    } else {
      verdict.textContent =
        'При текущих допущениях (переиспользование развёрток, 5–10 ч вручную) экономия в основном в контроле и PDM, не только в часах. Уточните замеры на 150 позициях.';
      verdict.className = 'calc-note warn';
    }

    drawChart(readNum('rowsTyp'), readNum('rowsPeak'));
  }

  function drawChart(rowsTyp, rowsPeak) {
    const canvas = document.getElementById('benefit-chart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = { l: 48, r: 24, t: 24, b: 40 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    const maxRows = 200;
    const points = [];
    for (let r = 10; r <= maxRows; r += 5) {
      const pluginMin = 30 + (r / maxRows) * 50 + (r > 100 ? (r - 100) * 0.15 : 0);
      const controlIdx = 20 + (r / maxRows) * 80;
      points.push({ r, pluginMin, controlIdx });
    }

    const maxY = 120;
    function x(r) { return pad.l + (r / maxRows) * plotW; }
    function y(v) { return pad.t + plotH - (v / maxY) * plotH; }

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = pad.t + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
    }

    ctx.strokeStyle = '#155a86';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = x(p.r);
      const py = y(p.pluginMin);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = x(p.r);
      const py = y(p.controlIdx);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    [rowsTyp, rowsPeak].forEach((r, i) => {
      const p = points.find(pt => pt.r >= r) || points[points.length - 1];
      ctx.fillStyle = i === 0 ? '#155a86' : '#e87722';
      ctx.beginPath();
      ctx.arc(x(r), y(p.pluginMin), 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#5a6573';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText('Позиций в Excel →', pad.l, h - 10);
    ctx.save();
    ctx.translate(14, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('мин / индекс', 0, 0);
    ctx.restore();

    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#155a86';
    ctx.fillText('— время плагина', pad.l, 16);
    ctx.fillStyle = '#e87722';
    ctx.fillText('— контроль комплекта', pad.l + 130, 16);
  }

  function bind() {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (rangeIds.includes(id)) {
          const out = document.getElementById(id + '-out');
          if (out) out.textContent = el.value;
        }
        calc();
      });
    });
    rangeIds.forEach(id => {
      const out = document.getElementById(id + '-out');
      const el = document.getElementById(id);
      if (out && el) out.textContent = el.value;
    });
    calc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
