(function () {
  'use strict';

  const TARGET_PAYBACK = 7;
  const ARTIFACTS_PER_POS = 3; // DXF + чертёж развёртки + лист модели в PDF

  const ids = [
    'projects', 'models', 'reusePct',
    'minManual', 'minAuto',
    'hourlyRate', 'projectCost'
  ];

  const rangeIds = ['projects', 'models', 'reusePct'];

  function fmt(n) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(n));
  }

  function fmtDec(n, d) {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }).format(n);
  }

  function readNum(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calc() {
    const projects = readNum('projects');
    const models = readNum('models');
    const reuse = readNum('reusePct') / 100;
    const minManual = readNum('minManual');
    const minAuto = readNum('minAuto');
    const rate = readNum('hourlyRate');
    const cost = readNum('projectCost');

    const positionsMonth = projects * models;
    const artifactsMonth = positionsMonth * ARTIFACTS_PER_POS;
    const unfoldingsMonth = positionsMonth;
    const drawingsMonth = positionsMonth;

    const minManualEff = minManual * (1 - reuse * 0.6);
    const minAutoEff = minAuto * (1 - reuse * 0.3);

    const hoursManualMonth = (positionsMonth * minManualEff) / 60;
    const hoursAutoMonth = (positionsMonth * minAutoEff) / 60;
    const hoursSavedMonth = Math.max(0, hoursManualMonth - hoursAutoMonth);
    const savingsMonth = hoursSavedMonth * rate;

    const payback = savingsMonth > 0 ? cost / savingsMonth : Infinity;
    const maxPrice = savingsMonth * TARGET_PAYBACK;
    const costPerProject = projects > 0 ? cost / (projects * 12) : 0;

    setText('positionsMonth', fmt(positionsMonth));
    setText('unfoldingsMonth', fmt(unfoldingsMonth));
    setText('savingsMonth', fmt(savingsMonth));
    setText('payback', payback === Infinity ? '—' : payback.toFixed(1));
    setText('maxPrice', fmt(maxPrice));
    setText('costPerProject', fmt(costPerProject));

    setText('fxProjects', fmt(projects));
    setText('fxModels', fmt(models));
    setText('fxPositions', fmt(positionsMonth));
    setText('fxArtifacts', fmt(artifactsMonth));
    setText('fxMinMan', fmtDec(minManualEff, 1));
    setText('fxMinAuto', fmtDec(minAutoEff, 1));
    setText('fxHoursMan', fmtDec(hoursManualMonth, 1));
    setText('fxHoursAuto', fmtDec(hoursAutoMonth, 1));
    setText('fxHoursSave', fmtDec(hoursSavedMonth, 1));
    setText('fxRate', fmt(rate));
    setText('fxSavings', fmt(savingsMonth));

    const verdict = document.getElementById('calcVerdict');
    if (payback <= TARGET_PAYBACK) {
      verdict.textContent =
        'При введённых параметрах окупаемость укладывается в целевые ' +
        TARGET_PAYBACK + ' мес.';
      verdict.className = 'calc-note ok';
    } else if (payback < 24) {
      verdict.textContent =
        'Окупаемость ' + payback.toFixed(1) + ' мес — обсудить график оплаты ' +
        'или уточнить минуты на позицию при ' + fmt(models) + ' деталях в проекте.';
      verdict.className = 'calc-note warn';
    } else {
      verdict.textContent =
        'При переиспользовании развёрток экономия в часах может быть скромной. ' +
        'Выгода также в контроле ' + fmt(positionsMonth) + ' позиций/мес и связке с PDM.';
      verdict.className = 'calc-note warn';
    }

    drawChart(models, projects);
  }

  function drawChart(models, projects) {
    const canvas = document.getElementById('benefit-chart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = { l: 52, r: 24, t: 28, b: 44 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    const maxModels = 200;
    const points = [];
    for (let m = 50; m <= maxModels; m += 10) {
      const pluginMin = 20 + m * 0.35 + (m > 120 ? (m - 120) * 0.2 : 0);
      const manualH = 4 + m * 0.025;
      points.push({ m, pluginMin, manualH: manualH * 60 });
    }

    const maxY = 180;
    function x(m) { return pad.l + ((m - 50) / (maxModels - 50)) * plotW; }
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
      const px = x(p.m);
      const py = y(p.pluginMin);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = x(p.m);
      const py = y(p.manualH);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    const cur = points.find(pt => pt.m >= models) || points[points.length - 1];
    ctx.fillStyle = '#155a86';
    ctx.beginPath();
    ctx.arc(x(models), y(cur.pluginMin), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5a6573';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText('Позиций в проекте →', pad.l, h - 12);
    ctx.save();
    ctx.translate(14, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('минут на проект', 0, 0);
    ctx.restore();

    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#155a86';
    ctx.fillText('— плагин', pad.l, 18);
    ctx.fillStyle = '#b45309';
    ctx.fillText('— вручную (оценка)', pad.l + 80, 18);
    ctx.fillStyle = '#5a6573';
    ctx.fillText('сейчас: ' + models + ' поз. × ' + projects + ' пр./мес', pad.l + 220, 18);
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
