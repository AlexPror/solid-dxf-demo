(function () {
  'use strict';

  const TARGET_PAYBACK_DEFAULT = 7;
  const HOURS_MONTH = 168;
  const DEV_COST_DEFAULT = 930000;

  const ids = [
    'projects', 'models', 'reusePct', 'staffMode', 'costMode',
    'hoursManualPkg', 'hoursAutoPkg',
    'salaryMonth', 'targetPayback',
    'urgentShare', 'hoursEarlierLaser', 'laserHourCost',
    'kitErrorsMonth', 'kitErrorCost',
    'projectCost'
  ];

  const rangeIds = ['projects', 'models', 'reusePct', 'urgentShare', 'targetPayback'];

  let logEntries = [];
  let lastSnapshot = null;
  let hasCalculated = false;

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

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function logLine(html) {
    logEntries.push(html);
    const el = document.getElementById('calcLog');
    if (!el) return;
    const row = document.createElement('div');
    row.className = 'log-line';
    row.innerHTML = html;
    el.appendChild(row);
  }

  function clearLog() {
    logEntries = [];
    const el = document.getElementById('calcLog');
    if (el) el.innerHTML = '';
  }

  /** Часы на один пакет: база из полей + поправка от числа позиций и переиспользования */
  function packageHours(models, reusePct, baseManual, baseAuto) {
    const reuse = reusePct / 100;
    const posFactor = 1 + (models - 100) / 200;
    const manual = baseManual * (1 + (posFactor - 1) * (1 - reuse * 0.7));
    const auto = baseAuto * (0.7 + posFactor * 0.3) * (1 - reuse * 0.15);
    return { manual, auto };
  }

  function calc(options) {
    const scroll = options && options.scroll;
    const flash = options && options.flash;
    clearLog();

    const projects = readNum('projects');
    const models = readNum('models');
    const reusePct = readNum('reusePct');
    const staffMode = document.getElementById('staffMode')?.value || 'parallel';
    const baseManual = readNum('hoursManualPkg');
    const baseAuto = readNum('hoursAutoPkg');
    const salaryMonth = readNum('salaryMonth');
    const costMode = document.getElementById('costMode')?.value || 'full';
    const employerCoeff = costMode === 'full' ? 1.3 : 1.0;
    const cost = readNum('projectCost') || DEV_COST_DEFAULT;
    const targetPayback = readNum('targetPayback') || TARGET_PAYBACK_DEFAULT;

    const urgentShare = readNum('urgentShare');
    const hoursEarlierLaser = readNum('hoursEarlierLaser');
    const laserHourCost = readNum('laserHourCost');
    const kitErrorsMonth = readNum('kitErrorsMonth');
    const kitErrorCost = readNum('kitErrorCost');

    const hourlySalary = salaryMonth / HOURS_MONTH;
    const hourlyFot = hourlySalary * employerCoeff;

    const pkg = packageHours(models, reusePct, baseManual, baseAuto);
    const hoursSavedPkg = Math.max(0, pkg.manual - pkg.auto);
    const hoursManualMonth = projects * pkg.manual;
    const hoursAutoMonth = projects * pkg.auto;
    const hoursSavedMonth = projects * hoursSavedPkg;

    const positionsMonth = projects * models;
    const sheetsMonth = positionsMonth;

    const savingsSalaryMonth = hoursSavedMonth * hourlySalary;
    const savingsFotMonth = hoursSavedMonth * hourlyFot;

    const paybackFot = savingsFotMonth > 0 ? cost / savingsFotMonth : Infinity;
    const paybackSalary = savingsSalaryMonth > 0 ? cost / savingsSalaryMonth : Infinity;
    const maxPriceFot = savingsFotMonth * targetPayback;
    const savingsFotYear = savingsFotMonth * 12;

    const urgentRuns = projects * (urgentShare / 100);
    const savingsLaserMonth = urgentRuns * hoursEarlierLaser * laserHourCost;
    const savingsKitMonth = kitErrorsMonth * kitErrorCost;
    const savingsFactoryMonth = savingsLaserMonth + savingsKitMonth;
    const savingsFactoryYear = savingsFactoryMonth * 12;
    const savingsTotalMonth = savingsFotMonth + savingsFactoryMonth;
    const savingsTotalYear = savingsTotalMonth * 12;

    const paybackTotal = savingsTotalMonth > 0 ? cost / savingsTotalMonth : Infinity;
    const maxPriceTotal = savingsTotalMonth * targetPayback;

    setText('positionsMonth', fmt(positionsMonth));
    setText('sheetsMonth', fmt(sheetsMonth));
    setText('hoursSavedMonth', fmtDec(hoursSavedMonth, 1));
    setText('savingsFotMonth', fmt(savingsFotMonth));
    setText('paybackFot', paybackFot === Infinity ? '—' : paybackFot.toFixed(1));
    setText('maxPriceFot', fmt(maxPriceFot));
    setText('savingsFactoryMonth', fmt(savingsFactoryMonth));
    setText('savingsFactoryYear', fmt(savingsFactoryYear));
    setText('savingsTotalMonth', fmt(savingsTotalMonth));
    setText('savingsTotalYear', fmt(savingsTotalYear));
    setText('paybackTotal', paybackTotal === Infinity ? '—' : paybackTotal.toFixed(1));
    setText('maxPriceTotal', fmt(maxPriceTotal));

    const paybackFotStr = paybackFot === Infinity ? '—' : paybackFot.toFixed(1);
    const paybackTotalStr = paybackTotal === Infinity ? '—' : paybackTotal.toFixed(1);
    const staffLabel = staffMode === 'parallel' ? 'параллельно' : 'подряд одним технологом';
    const costModeLabel = costMode === 'full' ? 'оклад + ~30% взносов' : 'только оклад';

    setHtml('descPositions',
      '<span class="f-eq">' + fmt(projects) + ' пр. × ' + fmt(models) + ' поз. = ' + fmt(positionsMonth) + ' шт.</span>');
    setHtml('descSheets',
      'По 1 листу на позицию: развёртка + модель в PDF.');
    setHtml('descHours',
      '<span class="f-eq">' + fmt(projects) + ' × (' + fmtDec(pkg.manual, 1) + ' − ' + fmtDec(pkg.auto, 1) + ') ч = ' +
      fmtDec(hoursSavedMonth, 1) + ' ч/мес</span>Учтено ' + reusePct + '% готовых развёрток.');
    setHtml('descFot',
      '<span class="f-eq">' + fmtDec(hoursSavedMonth, 1) + ' ч × ' + fmtDec(hourlyFot, 0) + ' ₽/ч = ' +
      fmt(savingsFotMonth) + ' ₽/мес</span>Ставка: ' + fmt(salaryMonth) + ' ÷ 168 (' + costModeLabel + ').');
    setHtml('descFotYear',
      'В год ' + fmt(savingsFotYear) + ' ₽ · окупаемость по ФОТ: ' + paybackFotStr + ' мес.');
    setHtml('descFactory',
      '<span class="f-eq">лазер ' + fmt(savingsLaserMonth) + ' + комплект ' + fmt(savingsKitMonth) + ' = ' +
      fmt(savingsFactoryMonth) + ' ₽/мес</span>' +
      fmtDec(urgentRuns, 1) + ' срочн. × ' + hoursEarlierLaser + ' ч × ' + fmt(laserHourCost) + ' ₽; ' +
      fmt(kitErrorsMonth) + ' срыв. × ' + fmt(kitErrorCost) + ' ₽.');
    setHtml('descFactoryYear',
      'В год ' + fmt(savingsFactoryYear) + ' ₽. Только срочные пакеты и срывы на станке.');
    setHtml('descTotal',
      '<span class="f-eq">' + fmt(savingsFotMonth) + ' + ' + fmt(savingsFactoryMonth) + ' = ' +
      fmt(savingsTotalMonth) + ' ₽/мес</span>');
    setHtml('descTotalYear',
      'В год ' + fmt(savingsTotalYear) + ' ₽. Слой 3 (сварка, покраска) не входит.');
    setHtml('descPaybackFot',
      '<span class="f-eq">' + fmt(cost) + ' ÷ ' + fmt(savingsFotMonth) + ' = ' + paybackFotStr + ' мес</span>Только слой 1.');
    setHtml('descPaybackTotal',
      '<span class="f-eq">' + fmt(cost) + ' ÷ ' + fmt(savingsTotalMonth) + ' = ' + paybackTotalStr + ' мес</span>Цель: ' + targetPayback + ' мес.');
    setHtml('descMaxPrice',
      '<span class="f-eq">' + fmt(savingsTotalMonth) + ' × ' + targetPayback + ' = ' + fmt(maxPriceTotal) + ' ₽</span>' +
      (paybackTotal <= targetPayback ? 'Внедрение укладывается в цель.' : 'При ' + fmt(cost) + ' ₽ цель не достигнута.'));

    lastSnapshot = {
      projects, models, reusePct, staffMode, staffLabel, baseManual, baseAuto,
      salaryMonth, costMode, costModeLabel, cost, targetPayback,
      urgentShare, hoursEarlierLaser, laserHourCost, kitErrorsMonth, kitErrorCost,
      positionsMonth, sheetsMonth, hoursSavedMonth, pkg, hourlyFot, hourlySalary,
      savingsFotMonth, savingsFotYear, savingsFactoryMonth, savingsFactoryYear,
      savingsTotalMonth, savingsTotalYear, paybackFot, paybackTotal, maxPriceTotal,
      urgentRuns, savingsLaserMonth, savingsKitMonth, verdict: ''
    };

    const staffNote = staffMode === 'parallel'
      ? fmt(projects) + ' технолог(ов) параллельно — в ФОТ сумма часов отдела, не × зарплат.'
      : '1 технолог, ' + fmt(projects) + ' пакет(ов) подряд — те же ' + fmtDec(hoursSavedMonth, 1) + ' ч/мес.';

    logLine('<span class="log-step">1</span><b>Масштаб.</b> ' + fmt(projects) + ' × ' + fmt(models) + ' = <b>' + fmt(positionsMonth) + '</b> поз./мес, <b>' + fmt(sheetsMonth) + '</b> листов.');

    logLine('<span class="log-step">2</span><b>1 пакет.</b> Вручную <b>' + fmtDec(pkg.manual, 1) + ' ч</b>, плагин <b>' + fmtDec(pkg.auto, 1) + ' ч</b>, экономия <b>' + fmtDec(hoursSavedPkg, 1) + ' ч</b> (reuse ' + reusePct + '%).');

    logLine('<span class="log-step">3</span><b>Кто работает.</b> ' + staffNote);

    logLine('<span class="log-step">4</span><b>Часы отдела.</b> ' + fmt(projects) + ' × ' + fmtDec(hoursSavedPkg, 1) + ' = <b>' + fmtDec(hoursSavedMonth, 1) + ' ч/мес</b>.');

    logLine('<span class="log-step">5</span><b>Ставка.</b> ' + fmt(salaryMonth) + ' ÷ 168 = ' + fmtDec(hourlySalary, 0) + ' ₽/ч' +
      (costMode === 'full' ? ', × 1,3 → <b>' + fmtDec(hourlyFot, 0) + ' ₽/ч</b> с взносами.' : '.'));

    logLine('<span class="log-step">6</span><b>Слой 1 — ФОТ.</b> ' + fmtDec(hoursSavedMonth, 1) + ' × ' + fmtDec(hourlyFot, 0) + ' = <b>' + fmt(savingsFotMonth) + ' ₽/мес</b> (' + fmt(savingsFotYear) + ' ₽/год).');

    logLine('<span class="log-step">7</span><b>Окупаемость ФОТ.</b> ' + fmt(cost) + ' ÷ ' + fmt(savingsFotMonth) + ' = <b>' + paybackFotStr + ' мес</b>.');

    logLine('<span class="log-step">8</span><b>Слой 2.</b> Лазер <b>' + fmt(savingsLaserMonth) + ' ₽</b> + комплект <b>' + fmt(savingsKitMonth) + ' ₽</b> = <b>' + fmt(savingsFactoryMonth) + ' ₽/мес</b>.');

    logLine('<span class="log-step">9</span><b>Слои 1+2.</b> ' + fmt(savingsFotMonth) + ' + ' + fmt(savingsFactoryMonth) + ' = <b>' + fmt(savingsTotalMonth) + ' ₽/мес</b>. Окупаемость <b>' + paybackTotalStr + ' мес</b>. Макс. цена при ' + targetPayback + ' мес: <b>' + fmt(maxPriceTotal) + ' ₽</b>.');

    logLine('<span class="log-step">10</span><b>Слой 3.</b> Сварка и покраска в ₽ не считаем. КП ' + fmt(DEV_COST_DEFAULT) + ' ₽ — себестоимость разработки.');

    if (typeof console !== 'undefined' && console.groupCollapsed) {
      console.groupCollapsed('[Калькулятор Docs] ' + new Date().toLocaleTimeString('ru'));
      console.table({
        projects, models, reusePct, staffMode, costMode,
        hoursManualPkg: pkg.manual, hoursAutoPkg: pkg.auto,
        hoursSavedMonth, hourlyFot, savingsFotMonth, savingsFactoryMonth,
        savingsTotalMonth, paybackFot, paybackTotal, targetPayback, cost
      });
      console.groupEnd();
    }

    const verdict = document.getElementById('calcVerdict');
    let verdictText = '';
    if (paybackTotal <= targetPayback) {
      verdictText =
        'Суммарно (ФОТ + производство) окупаемость ' + paybackTotalStr +
        ' мес — укладывается в цель ' + targetPayback + ' мес.';
      verdict.className = 'calc-note ok';
    } else if (paybackTotal < paybackFot) {
      verdictText =
        'Только ФОТ — ' + paybackFotStr + ' мес; с производством — ' +
        paybackTotalStr + ' мес (цель ' + targetPayback + '). ' +
        'Слой 2 — срочные пакеты и меньше брака на лазере/гибке.';
      verdict.className = 'calc-note warn';
    } else {
      verdictText =
        'По ФОТ одному — ' + paybackFotStr + ' мес. Уточните срочные пакеты и ущерб срыва комплекта. ' +
        'Сварка/покраска в расчёт не входят (слой 3).';
      verdict.className = 'calc-note warn';
    }
    verdict.textContent = verdictText;
    if (lastSnapshot) lastSnapshot.verdict = verdictText;

    hasCalculated = true;
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) exportBtn.disabled = false;

    drawChart(models, pkg.manual, pkg.auto);

    if (flash) {
      const panel = document.getElementById('calcResults');
      if (panel) {
        panel.classList.remove('calc-flash');
        void panel.offsetWidth;
        panel.classList.add('calc-flash');
      }
    }
    if (scroll) {
      const target = document.getElementById('calcResults') || document.getElementById('calcLog');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function niceStep(maxVal) {
    const raw = maxVal / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
    return Math.max(step, 1);
  }

  function drawChart(models, hoursMan, hoursAuto) {
    const canvas = document.getElementById('benefit-chart');
    if (!canvas || !canvas.getContext) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement ? canvas.parentElement.clientWidth - 40 : 800;
    const cssH = 400;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW;
    const h = cssH;
    const pad = { l: 58, r: 28, t: 36, b: 52 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const minX = 100;
    const maxX = 200;
    const points = [];
    for (let m = minX; m <= maxX; m += 10) {
      const pkg = packageHours(m, readNum('reusePct'), readNum('hoursManualPkg'), readNum('hoursAutoPkg'));
      points.push({ m, manual: pkg.manual * 60, auto: pkg.auto * 60 });
    }

    const maxY = Math.max(...points.map(p => p.manual)) * 1.08;
    const yStep = niceStep(maxY);
    const yMax = Math.ceil(maxY / yStep) * yStep;

    function x(m) { return pad.l + ((m - minX) / (maxX - minX)) * plotW; }
    function y(v) { return pad.t + plotH - (v / yMax) * plotH; }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#e8ecf0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#5a6573';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = 0; v <= yMax; v += yStep) {
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
      ctx.fillText(String(Math.round(v)), pad.l - 8, yy);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let m = minX; m <= maxX; m += 25) {
      const xx = x(m);
      ctx.beginPath();
      ctx.moveTo(xx, pad.t);
      ctx.lineTo(xx, pad.t + plotH);
      ctx.stroke();
      ctx.fillText(String(m), xx, pad.t + plotH + 8);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a2430';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText('Позиций в проекте', pad.l + plotW / 2, h - 14);
    ctx.save();
    ctx.translate(16, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Минут на пакет', 0, 0);
    ctx.restore();

    function drawLine(key, color, dash) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      points.forEach((p, i) => {
        const px = x(p.m);
        const py = y(p[key]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawLine('auto', '#155a86', []);
    drawLine('manual', '#b45309', [8, 5]);

    const curMan = hoursMan * 60;
    const curAuto = hoursAuto * 60;
    const cx = x(models);

    ctx.strokeStyle = '#d5dbe3';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, pad.t);
    ctx.lineTo(cx, pad.t + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#155a86';
    ctx.beginPath();
    ctx.arc(cx, y(curAuto), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(cx, y(curMan), 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a2430';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    const labelY = Math.min(y(curAuto), y(curMan)) - 10;
    ctx.fillText(models + ' поз.: плагин ' + Math.round(curAuto) + ' мин, вручную ' + Math.round(curMan) + ' мин', cx + 10, Math.max(pad.t + 4, labelY));

    const leg = document.getElementById('chartCurLabel');
    if (leg) {
      leg.textContent = 'Ваш проект: ' + models + ' поз. — плагин ' + Math.round(curAuto) + ' мин / вручную ' + Math.round(curMan) + ' мин';
    }
  }

  let chartResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => {
      const m = readNum('models');
      const pkg = packageHours(m, readNum('reusePct'), readNum('hoursManualPkg'), readNum('hoursAutoPkg'));
      drawChart(m, pkg.manual, pkg.auto);
    }, 150);
  });

  function buildPdfHtml() {
    if (!lastSnapshot || !logEntries.length) return '';
    const s = lastSnapshot;
    const dateStr = new Date().toLocaleString('ru-RU');
    const logHtml = logEntries.map((line, i) =>
      '<div class="pdf-step"><span class="pdf-n">' + (i + 1) + '</span><div>' + line + '</div></div>'
    ).join('');

    return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/>' +
      '<title>Журнал расчёта · Пакет в цех</title>' +
      '<style>' +
      'body{font-family:Segoe UI,sans-serif;font-size:11pt;color:#1a2430;margin:16mm;line-height:1.45}' +
      'h1{font-size:16pt;color:#0e3a5a;margin:0 0 4px}h2{font-size:12pt;color:#155a86;margin:20px 0 8px;border-bottom:1px solid #d5dbe3;padding-bottom:4px}' +
      'table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #d5dbe3;padding:6px 8px;text-align:left;font-size:10pt}' +
      'th{background:#f4f6f8}.pdf-step{display:flex;gap:10px;margin:8px 0;padding:8px;border-bottom:1px solid #eee}' +
      '.pdf-n{flex-shrink:0;width:22px;height:22px;background:#0e3a5a;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:9pt;font-weight:700}' +
      '.muted{color:#5a6573;font-size:9pt}.result-row{margin:6px 0}.tag{font-size:8pt;text-transform:uppercase;color:#5a6573}' +
      '@media print{body{margin:12mm}}' +
      '</style></head><body>' +
      '<h1>Калькулятор окупаемости · Пакет в цех (Docs v1)</h1>' +
      '<p class="muted">ООО «Меркатор Калуга» · черновик для обсуждения · ' + dateStr + '</p>' +

      '<h2>Вводные параметры</h2><table>' +
      '<tr><th>Параметр</th><th>Значение</th></tr>' +
      '<tr><td>Проектов в месяц</td><td>' + s.projects + '</td></tr>' +
      '<tr><td>Позиций в проекте</td><td>' + s.models + '</td></tr>' +
      '<tr><td>Готовых развёрток</td><td>' + s.reusePct + '%</td></tr>' +
      '<tr><td>Режим работы</td><td>' + s.staffLabel + '</td></tr>' +
      '<tr><td>Часов вручную / пакет</td><td>' + s.baseManual + '</td></tr>' +
      '<tr><td>Часов с плагином / пакет</td><td>' + s.baseAuto + '</td></tr>' +
      '<tr><td>Оклад технолога</td><td>' + fmt(s.salaryMonth) + ' ₽/мес</td></tr>' +
      '<tr><td>Ставка в расчёте</td><td>' + s.costModeLabel + '</td></tr>' +
      '<tr><td>Срочных пакетов</td><td>' + s.urgentShare + '%</td></tr>' +
      '<tr><td>Часов раньше на лазер</td><td>' + s.hoursEarlierLaser + '</td></tr>' +
      '<tr><td>Стоимость часа лазера</td><td>' + fmt(s.laserHourCost) + ' ₽</td></tr>' +
      '<tr><td>Срывов комплекта / мес</td><td>' + s.kitErrorsMonth + '</td></tr>' +
      '<tr><td>Ущерб 1 срыва</td><td>' + fmt(s.kitErrorCost) + ' ₽</td></tr>' +
      '<tr><td>Стоимость внедрения</td><td>' + fmt(s.cost) + ' ₽</td></tr>' +
      '<tr><td>Целевая окупаемость</td><td>' + s.targetPayback + ' мес</td></tr>' +
      '</table>' +

      '<h2>Итоговые показатели</h2>' +
      '<div class="result-row"><span class="tag">Масштаб</span> Позиций/мес: <b>' + fmt(s.positionsMonth) + '</b></div>' +
      '<div class="result-row"><span class="tag">Слой 1</span> ФОТ: <b>' + fmt(s.savingsFotMonth) + ' ₽/мес</b> (' + fmt(s.savingsFotYear) + ' ₽/год)</div>' +
      '<div class="result-row"><span class="tag">Слой 2</span> Производство: <b>' + fmt(s.savingsFactoryMonth) + ' ₽/мес</b></div>' +
      '<div class="result-row"><span class="tag">1+2</span> Суммарно: <b>' + fmt(s.savingsTotalMonth) + ' ₽/мес</b> · окупаемость <b>' +
      (s.paybackTotal === Infinity ? '—' : s.paybackTotal.toFixed(1)) + ' мес</b></div>' +
      '<div class="result-row"><span class="tag">Цель</span> Макс. цена при ' + s.targetPayback + ' мес: <b>' + fmt(s.maxPriceTotal) + ' ₽</b></div>' +
      '<p><b>Вывод:</b> ' + s.verdict + '</p>' +

      '<h2>Пошаговый журнал</h2>' + logHtml +
      '<p class="muted">Слой 3 (весь завод: сварка, покраска) в рублях не считается.</p>' +
      '</body></html>';
  }

  function exportJournalPdf() {
    if (!hasCalculated || !lastSnapshot) {
      alert('Сначала нажмите «Рассчитать».');
      return;
    }
    const html = buildPdfHtml();
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) {
      alert('Разрешите всплывающие окна для экспорта PDF.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  }

  function bind() {
    const btn = document.getElementById('calcBtn');
    if (btn) {
      btn.addEventListener('click', () => calc({ scroll: true, flash: true }));
    }
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportJournalPdf);
    }

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, () => {
        if (rangeIds.includes(id)) {
          const out = document.getElementById(id + '-out');
          if (out) out.textContent = el.value;
        }
      });
    });
    rangeIds.forEach(id => {
      const out = document.getElementById(id + '-out');
      const el = document.getElementById(id);
      if (out && el) out.textContent = el.value;
    });
    calc({ scroll: false, flash: false });
    hasCalculated = true;
    const exportBtnInit = document.getElementById('exportPdfBtn');
    if (exportBtnInit) exportBtnInit.disabled = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
