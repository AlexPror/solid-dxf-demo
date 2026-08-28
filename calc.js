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

  const rangeIds = ['projects', 'models', 'reusePct', 'urgentShare'];

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

  function logLine(html) {
    const el = document.getElementById('calcLog');
    if (!el) return;
    const row = document.createElement('div');
    row.className = 'log-line';
    row.innerHTML = html;
    el.appendChild(row);
  }

  function clearLog() {
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
    setText('paybackTotalDup', paybackTotal === Infinity ? '—' : paybackTotal.toFixed(1));
    setText('maxPriceTotal', fmt(maxPriceTotal));
    setText('maxPriceTotalInline', fmt(maxPriceTotal));
    setText('savingsTotalMonthDup', fmt(savingsTotalMonth));
    setText('targetPaybackLabel', String(targetPayback));
    setText('maxPriceGoalLabel', String(targetPayback));
    setText('fxTargetPayback', String(targetPayback));
    setText('fxUrgentRuns', fmtDec(urgentRuns, 1));
    setText('fxLaserSave', fmt(savingsLaserMonth));
    setText('fxKitSave', fmt(savingsKitMonth));
    setText('fxFactoryTotal', fmt(savingsFactoryMonth));
    setText('hourlySalary', fmtDec(hourlySalary, 0));
    setText('hourlyFot', fmtDec(hourlyFot, 0));

    setText('fxProjects', fmt(projects));
    setText('fxModels', fmt(models));
    setText('fxPositions', fmt(positionsMonth));
    setText('fxSheets', fmt(sheetsMonth));
    setText('fxHoursManPkg', fmtDec(pkg.manual, 1));
    setText('fxHoursAutoPkg', fmtDec(pkg.auto, 1));
    setText('fxHoursSavePkg', fmtDec(hoursSavedPkg, 1));
    setText('fxHoursManMo', fmtDec(hoursManualMonth, 1));
    setText('fxHoursAutoMo', fmtDec(hoursAutoMonth, 1));
    setText('fxHoursSaveMo', fmtDec(hoursSavedMonth, 1));
    setText('fxSalary', fmt(salaryMonth));
    setText('fxCoeff', costMode === 'full' ? '1,30 (взносы)' : '1,00 (только оклад)');
    setText('fxHourSal', fmtDec(hourlySalary, 0));
    setText('fxHourFot', fmtDec(hourlyFot, 0));
    setText('fxSavingsFot', fmt(savingsFotMonth));
    setText('fxCost', fmt(cost));

    logLine('<span class="log-step">1</span> <b>Масштаб</b>: ' +
      fmt(projects) + ' проект(ов)/мес × ' + fmt(models) + ' поз. = <b>' +
      fmt(positionsMonth) + '</b> поз./мес, <b>' + fmt(sheetsMonth) +
      '</b> развёрток + чертежей (по 1 на позицию).');

    logLine('<span class="log-step">2</span> <b>Часы на 1 пакет</b> (проект): вручную <b>' +
      fmtDec(pkg.manual, 1) + ' ч</b>, с плагином <b>' + fmtDec(pkg.auto, 1) +
      ' ч</b>, экономия <b>' + fmtDec(hoursSavedPkg, 1) + ' ч</b>. ' +
      'База: ' + fmtDec(baseManual, 1) + '/' + fmtDec(baseAuto, 1) +
      ' ч; поправка на ' + fmt(models) + ' поз. и ' + reusePct + '% готовых развёрток.');

    const staffNote = staffMode === 'parallel'
      ? fmt(projects) + ' технолог(ов) параллельно — по одному пакету каждый. ' +
        'В ФОТ считаем <b>сумму часов отдела</b>, не ×8 зарплат.'
      : '1 технолог гоняет ' + fmt(projects) +
        ' пакет(ов) подряд — те же <b>' + fmtDec(hoursSavedMonth, 1) +
        ' ч/мес</b> экономии отдела.';
    logLine('<span class="log-step">3</span> <b>Кто работает</b>: ' + staffNote);

    logLine('<span class="log-step">4</span> <b>Часы отдела в месяц</b>: ' +
      fmt(projects) + ' × ' + fmtDec(hoursSavedPkg, 1) + ' ч = <b>' +
      fmtDec(hoursSavedMonth, 1) + ' ч</b> высвобождается.');

    logLine('<span class="log-step">5</span> <b>Ставка технолога</b>: оклад ' + fmt(salaryMonth) +
      ' ₽ ÷ ' + HOURS_MONTH + ' ч = <b>' + fmtDec(hourlySalary, 0) + ' ₽/ч</b> «в руки». ' +
      (costMode === 'full'
        ? 'Работодатель сверх оклада платит ~30% взносов (ПФР, ФСС, ФОМС) → полная стоимость места <b>' +
          fmt(Math.round(salaryMonth * employerCoeff)) + ' ₽/мес</b> → <b>' + fmtDec(hourlyFot, 0) + ' ₽/ч</b>.'
        : 'Считаем только оклад, без взносов работодателя → <b>' + fmtDec(hourlyFot, 0) + ' ₽/ч</b>.'));

    logLine('<span class="log-step">6</span> <b>Экономия ФОТ</b>: ' +
      fmtDec(hoursSavedMonth, 1) + ' ч × ' + fmtDec(hourlyFot, 0) +
      ' ₽/ч = <b>' + fmt(savingsFotMonth) + ' ₽/мес</b> (' +
      fmt(savingsFotYear) + ' ₽/год). По окладу без взносов: ' +
      fmt(savingsSalaryMonth) + ' ₽/мес.');

    logLine('<span class="log-step">7</span> <b>Слой 1 — ФОТ технологии</b>: ' +
      fmtDec(hoursSavedMonth, 1) + ' ч × ' + fmtDec(hourlyFot, 0) +
      ' ₽/ч = <b>' + fmt(savingsFotMonth) + ' ₽/мес</b> (' +
      fmt(savingsFotYear) + ' ₽/год). Окупаемость только по ФОТ: <b>' +
      (paybackFot === Infinity ? '—' : paybackFot.toFixed(1)) + ' мес</b>.');

    logLine('<span class="log-step">8</span> <b>Слой 2 — производство</b> (оценка, не автоматический эффект на весь завод): ' +
      'срочных пакетов ' + fmtDec(urgentRuns, 1) + ' (' + urgentShare + '%) × ' +
      hoursEarlierLaser + ' ч раньше на лазер × ' + fmt(laserHourCost) + ' ₽/ч = <b>' +
      fmt(savingsLaserMonth) + ' ₽</b>; предотвращённых срывов комплекта ' +
      fmt(kitErrorsMonth) + ' × ' + fmt(kitErrorCost) + ' ₽ = <b>' +
      fmt(savingsKitMonth) + ' ₽</b>. Итого слой 2: <b>' + fmt(savingsFactoryMonth) + ' ₽/мес</b>.');

    logLine('<span class="log-step">9</span> <b>Слой 1 + 2</b>: ' + fmt(savingsFotMonth) + ' + ' +
      fmt(savingsFactoryMonth) + ' = <b>' + fmt(savingsTotalMonth) + ' ₽/мес</b> (' +
      fmt(savingsTotalYear) + ' ₽/год). Окупаемость суммарно: <b>' +
      (paybackTotal === Infinity ? '—' : paybackTotal.toFixed(1)) + ' мес</b>. ' +
      'При ' + targetPayback + ' мес макс. цена: <b>' + fmt(maxPriceTotal) + ' ₽</b> ' +
      '(экономия × ' + targetPayback + ' = ' + fmt(savingsTotalMonth) + ' × ' + targetPayback + ').');

    logLine('<span class="log-step">10</span> <b>Слой 3 — весь завод</b> (сварка, покраска, закуп листа): ' +
      'в рублях <b>не считаем</b> — ускорение есть только если КД на критическом пути. ' +
      'Если лазер и так в очереди на дни, выигрыш = ёмкость технологии, не −N дней по цеху. ' +
      'Цена КП ' + fmt(DEV_COST_DEFAULT) + ' ₽ — себестоимость разработки (~46 дн).');

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
    if (paybackTotal <= targetPayback) {
      verdict.textContent =
        'Суммарно (ФОТ + производство) окупаемость ' + paybackTotal.toFixed(1) +
        ' мес — укладывается в цель ' + targetPayback + ' мес.';
      verdict.className = 'calc-note ok';
    } else if (paybackTotal < paybackFot) {
      verdict.textContent =
        'Только ФОТ — ' + paybackFot.toFixed(1) + ' мес; с производством — ' +
        paybackTotal.toFixed(1) + ' мес (цель ' + targetPayback + '). ' +
        'Слой 2 — срочные пакеты и меньше брака на лазере/гибке.';
      verdict.className = 'calc-note warn';
    } else {
      verdict.textContent =
        'По ФОТ одному — ' + paybackFot.toFixed(1) + ' мес. Увеличьте долю срочных или ущерб срыва комплекта, ' +
        'если хотите показать эффект на производство. Сварка/покраска в расчёт не входят.';
      verdict.className = 'calc-note warn';
    }

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

  function drawChart(models, hoursMan, hoursAuto) {
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
    for (let m = 100; m <= maxModels; m += 10) {
      const pkg = packageHours(m, readNum('reusePct'), readNum('hoursManualPkg'), readNum('hoursAutoPkg'));
      points.push({ m, manual: pkg.manual * 60, auto: pkg.auto * 60 });
    }

    const maxY = Math.max(600, ...points.map(p => p.manual)) * 1.1;
    function x(m) { return pad.l + ((m - 100) / (maxModels - 100)) * plotW; }
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

    function drawLine(key, color, dash) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
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
    drawLine('manual', '#b45309', [6, 4]);

    ctx.fillStyle = '#155a86';
    ctx.beginPath();
    ctx.arc(x(models), y(hoursAuto * 60), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(x(models), y(hoursMan * 60), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5a6573';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText('Позиций в проекте →', pad.l, h - 12);
    ctx.save();
    ctx.translate(14, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('минут на пакет', 0, 0);
    ctx.restore();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#155a86';
    ctx.fillText('— плагин', pad.l, 18);
    ctx.fillStyle = '#b45309';
    ctx.fillText('— вручную', pad.l + 72, 18);
  }

  function bind() {
    const btn = document.getElementById('calcBtn');
    if (btn) {
      btn.addEventListener('click', () => calc({ scroll: true, flash: true }));
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
