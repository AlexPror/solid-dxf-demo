(function () {
  'use strict';

  const TARGET_PAYBACK_DEFAULT = 7;
  const HOURS_MONTH = 168;
  const DEV_COST_DEFAULT = 930000;
  const DEV_HOURLY_NPD = 2500;
  const MARKET_INTEGRATOR_REF = 3400000;
  const BENCH_MANUAL_PKG_HOURS = 8;
  const BENCH_AUTO_PKG_HOURS = 0.75;
  const BENCH_MODELS = 150;

  /** Параметры для строки экономики на сайте (те же, что в скрытом калькуляторе по умолчанию). */
  const EXEC_DEFAULTS = {
    projects: 8,
    models: BENCH_MODELS,
    reusePct: 0,
    hoursManualPkg: BENCH_MANUAL_PKG_HOURS,
    hoursAutoPkg: BENCH_AUTO_PKG_HOURS,
    salaryMonth: 90000,
    employerCoeff: 1.3,
    cost: DEV_COST_DEFAULT
  };

  const MARKET_TIERS = [
    { label: 'Биржа / VBA', low: 600000, high: 1200000, rate: '1,5–3,5 тыс. ₽/ч', dim: true },
    { label: 'КП, себестоимость', low: DEV_COST_DEFAULT, high: DEV_COST_DEFAULT, rate: DEV_HOURLY_NPD + ' ₽/ч', highlight: true },
    { label: 'Бутик SW API', low: 1800000, high: 3200000, rate: '4–7 тыс. ₽/ч' },
    { label: 'Интегратор PDM', low: 2500000, high: 4500000, rate: '6–10 тыс. ₽/ч' },
    { label: 'Черновик партнёра', low: 3400000, high: 3400000, rate: '480 ч × 7 000 ₽', ref: true }
  ];

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
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseFloat(el.value) || 0;
  }

  function benchInput(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fallback;
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
    setText('resultProjectCost', fmt(cost));

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
      fmtDec(hoursSavedMonth, 1) + ' ч/мес</span>Учтено ' + reusePct + '% готовых чертежей развёрток.');
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
      'В год ' + fmt(savingsTotalYear) + ' ₽. Срок изделия (сварка, покраска) не входит.');
    setHtml('descPaybackFot',
      '<span class="f-eq">' + fmt(cost) + ' ÷ ' + fmt(savingsFotMonth) + ' = ' + paybackFotStr + ' мес</span>Только отдел технологии.');
    setHtml('descPaybackTotal',
      '<span class="f-eq">' + fmt(cost) + ' ÷ ' + fmt(savingsTotalMonth) + ' = ' + paybackTotalStr + ' мес</span>Цель: ' + targetPayback + ' мес.' +
      (savingsFactoryMonth === 0 ? ' Риски на станке = 0 — совпадает с отделом.' : ''));
    const ceilingOk = cost <= maxPriceTotal;
    setHtml('descMaxPrice',
      '<span class="f-eq">' + fmt(savingsTotalMonth) + ' × ' + targetPayback + ' = ' + fmt(maxPriceTotal) + ' ₽</span>' +
      'Сколько можно обосновать за ' + targetPayback + ' мес при выбранной экономии.');
    setHtml('descProjectCost',
      'Фиксированная цена из поля ввода. Не пересчитывается от слоя «станок».' +
      (ceilingOk
        ? ' КП укладывается в потолок ' + fmt(maxPriceTotal) + ' ₽.'
        : ' КП ' + fmt(cost) + ' ₽ выше потолка ' + fmt(maxPriceTotal) + ' ₽ — при таких вводных цель ' + targetPayback + ' мес не достигается.'));

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

    logLine('<span class="log-step">2</span><b>1 пакет.</b> Вручную <b>' + fmtDec(pkg.manual, 1) + ' ч</b>, плагин <b>' + fmtDec(pkg.auto, 1) + ' ч</b>, экономия <b>' + fmtDec(hoursSavedPkg, 1) + ' ч</b> (готовых чертежей ' + reusePct + '%).');

    logLine('<span class="log-step">3</span><b>Кто работает.</b> ' + staffNote);

    logLine('<span class="log-step">4</span><b>Часы отдела.</b> ' + fmt(projects) + ' × ' + fmtDec(hoursSavedPkg, 1) + ' = <b>' + fmtDec(hoursSavedMonth, 1) + ' ч/мес</b>.');

    logLine('<span class="log-step">5</span><b>Ставка.</b> ' + fmt(salaryMonth) + ' ÷ 168 = ' + fmtDec(hourlySalary, 0) + ' ₽/ч' +
      (costMode === 'full' ? ', × 1,3 → <b>' + fmtDec(hourlyFot, 0) + ' ₽/ч</b> с взносами.' : '.'));

    logLine('<span class="log-step">6</span><b>Отдел технологии.</b> ' + fmtDec(hoursSavedMonth, 1) + ' × ' + fmtDec(hourlyFot, 0) + ' = <b>' + fmt(savingsFotMonth) + ' ₽/мес</b> (' + fmt(savingsFotYear) + ' ₽/год).');

    logLine('<span class="log-step">7</span><b>Окупаемость по отделу.</b> ' + fmt(cost) + ' ÷ ' + fmt(savingsFotMonth) + ' = <b>' + paybackFotStr + ' мес</b>.');

    logLine('<span class="log-step">8</span><b>Риски на станке.</b> Лазер <b>' + fmt(savingsLaserMonth) + ' ₽</b> + комплект <b>' + fmt(savingsKitMonth) + ' ₽</b> = <b>' + fmt(savingsFactoryMonth) + ' ₽/мес</b>.');

    logLine('<span class="log-step">9</span><b>Отдел + станок.</b> ' + fmt(savingsFotMonth) + ' + ' + fmt(savingsFactoryMonth) + ' = <b>' + fmt(savingsTotalMonth) + ' ₽/мес</b>. Окупаемость <b>' + paybackTotalStr + ' мес</b>.');
    logLine('<span class="log-step">10</span><b>КП и потолок.</b> Стоимость внедрения <b>' + fmt(cost) + ' ₽</b> (ввод). Потолок при ' + targetPayback + ' мес: <b>' + fmt(maxPriceTotal) + ' ₽</b> = экономия × срок — не цена плагина.');
    logLine('<span class="log-step">11</span><b>Срок изделия.</b> Сварка и покраска в ₽ не считаем. Себестоимость разработки — см. блок «Стоимость vs рынок».');

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
        'Только отдел — ' + paybackFotStr + ' мес; с производством — ' +
        paybackTotalStr + ' мес (цель ' + targetPayback + '). ' +
        'Станок — срочные пакеты и меньше брака на лазере/гибочном станке.';
      verdict.className = 'calc-note warn';
    } else {
      verdictText =
        'По отделу одному — ' + paybackFotStr + ' мес. Уточните срочные пакеты и ущерб срыва комплекта. ' +
        'Сварка/покраска в расчёт не входят (срок изделия).';
      verdict.className = 'calc-note warn';
    }
    verdict.textContent = verdictText;
    if (lastSnapshot) lastSnapshot.verdict = verdictText;

    hasCalculated = true;
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) exportBtn.disabled = false;

    drawChart(models, pkg.manual, pkg.auto);
    drawMarketChart(cost);

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

  function fmtShort(n) {
    if (n >= 1000000) {
      return fmtDec(n / 1000000, n % 1000000 === 0 ? 0 : 2).replace(',', '.') + ' млн';
    }
    if (n >= 1000) {
      return fmt(Math.round(n / 1000)) + ' тыс.';
    }
    return fmt(n);
  }

  function updateMarketHero(cost) {
    const SCALE_MAX = 4500000;
    const ref = MARKET_INTEGRATOR_REF;
    const c = cost || DEV_COST_DEFAULT;
    const saved = Math.max(0, ref - c);
    const kpPct = Math.min(100, (c / SCALE_MAX) * 100);
    const savePct = Math.min(100 - kpPct, (saved / SCALE_MAX) * 100);
    const refPct = Math.min(100, (ref / SCALE_MAX) * 100);
    const savedPct = ref > 0 ? Math.round((saved / ref) * 100) : 0;

    const kpEl = document.getElementById('marketScaleKp');
    const saveEl = document.getElementById('marketScaleSave');
    const refEl = document.getElementById('marketScaleRef');
    if (kpEl) {
      kpEl.style.width = kpPct + '%';
    }
    if (saveEl) {
      saveEl.style.left = kpPct + '%';
      saveEl.style.width = savePct + '%';
    }
    if (refEl) {
      refEl.style.left = refPct + '%';
    }

    setText('marketScaleKpLabel', fmtShort(c));
    setText('marketScaleSaveLabel', saved >= 500000 ? '−' + fmtShort(saved) : 'разница');
    setText('marketKpValue', fmt(c) + ' ₽');
    setText('marketSavedValue', fmt(saved) + ' ₽');
    setText('marketSavedPct', '≈ ' + savedPct + '% от оценки партнёра');
    setText('marketMathKp', fmt(c) + ' ₽');
  }

  function drawMarketChart(kpCost) {
    const canvas = document.getElementById('market-chart');
    if (!canvas || !canvas.getContext) return;

    const cost = kpCost || readNum('projectCost') || DEV_COST_DEFAULT;
    updateMarketHero(cost);

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement ? canvas.parentElement.clientWidth - 8 : 800;
    const rowH = 52;
    const cssH = MARKET_TIERS.length * rowH + 88;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW;
    const h = cssH;
    const pad = { l: 152, r: 20, t: 44, b: 40 };
    const plotW = w - pad.l - pad.r;
    const maxX = 4800000;

    function xVal(v) { return pad.l + (v / maxX) * plotW; }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    const kpX = xVal(cost);
    const refX = xVal(MARKET_INTEGRATOR_REF);

    if (refX > kpX + 12) {
      const bracketY = 14;
      ctx.strokeStyle = '#1f7a4d';
      ctx.fillStyle = '#1f7a4d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(kpX, bracketY + 10);
      ctx.lineTo(kpX, bracketY);
      ctx.lineTo(refX, bracketY);
      ctx.lineTo(refX, bracketY + 10);
      ctx.stroke();
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('−' + fmtShort(refX > kpX ? MARKET_INTEGRATOR_REF - cost : 0), (kpX + refX) / 2, bracketY - 2);
    }

    ctx.strokeStyle = '#e8ecf0';
    ctx.fillStyle = '#5a6573';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= maxX; v += 1000000) {
      const xx = xVal(v);
      ctx.beginPath();
      ctx.moveTo(xx, pad.t);
      ctx.lineTo(xx, h - pad.b);
      ctx.stroke();
      ctx.fillText((v / 1000000) + ' млн', xx, h - pad.b + 6);
    }

    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(refX, pad.t);
    ctx.lineTo(refX, h - pad.b);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c45f12';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3,4 млн · партнёр', Math.min(refX + 4, w - 110), pad.t - 6);

    MARKET_TIERS.forEach((tier, i) => {
      const y = pad.t + i * rowH + 12;
      const barH = 26;
      const x0 = xVal(tier.low);
      const x1 = xVal(tier.high);
      const isPoint = tier.low === tier.high;
      const barW = Math.max(isPoint ? 6 : x1 - x0, isPoint ? 6 : 4);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = tier.dim ? '#8a939e' : '#1a2430';
      ctx.font = tier.highlight ? 'bold 12px Segoe UI, sans-serif' : '12px Segoe UI, sans-serif';
      ctx.fillText(tier.label, pad.l - 8, y + barH / 2);

      if (tier.highlight) {
        ctx.fillStyle = '#1f7a4d';
        ctx.fillRect(pad.l, y, Math.max(x1 - pad.l, 8), barH);
        ctx.strokeStyle = '#0e3a5a';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad.l, y, Math.max(x1 - pad.l, 8), barH);
      } else if (tier.ref) {
        ctx.fillStyle = '#e87722';
        ctx.fillRect(x0 - 3, y, 6, barH);
      } else if (isPoint) {
        ctx.fillStyle = tier.dim ? '#b8c0c8' : '#155a86';
        ctx.fillRect(pad.l, y, Math.max(x1 - pad.l, 8), barH);
      } else {
        ctx.fillStyle = tier.dim ? 'rgba(90, 101, 115, 0.35)' : 'rgba(21, 90, 134, 0.5)';
        ctx.fillRect(x0, y, x1 - x0, barH);
      }

      const priceStr = isPoint
        ? fmt(tier.low) + ' ₽'
        : fmt(tier.low) + '–' + fmt(tier.high) + ' ₽';
      const labelX = tier.highlight
        ? Math.max(pad.l + 8, x1 + 8)
        : Math.min(Math.max(x1, pad.l) + 8, w - pad.r - 140);

      ctx.textAlign = 'left';
      ctx.fillStyle = tier.highlight ? '#0e3a5a' : '#5a6573';
      ctx.font = tier.highlight ? 'bold 11px Segoe UI, sans-serif' : '10px Segoe UI, sans-serif';
      ctx.fillText(priceStr, labelX, y + barH / 2 - 5);
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.fillStyle = '#8a939e';
      ctx.fillText(tier.rate, labelX, y + barH / 2 + 8);
    });

    ctx.strokeStyle = '#1f7a4d';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(kpX, pad.t);
    ctx.lineTo(kpX, h - pad.b);
    ctx.stroke();
    ctx.fillStyle = '#1f7a4d';
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('КП', kpX - 4, pad.t - 6);

    const saved = Math.max(0, MARKET_INTEGRATOR_REF - cost);
    const note = document.getElementById('marketChartNote');
    if (note) {
      note.innerHTML =
        '<strong>Зелёная полоса и линия «КП»</strong> — цена в КП (<strong>' + fmt(cost) + ' ₽</strong>). ' +
        'Оранжевая отметка — черновик партнёра. Между ними <strong>' + fmt(saved) + ' ₽</strong> — ' +
        'это не скидка «с потолка», а разница моделей: один исполнитель по себестоимости vs команда с руководителем проекта и накладными.';
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
    const reusePct = benchInput('reusePct', 0);
    const baseManual = benchInput('hoursManualPkg', BENCH_MANUAL_PKG_HOURS);
    const baseAuto = benchInput('hoursAutoPkg', BENCH_AUTO_PKG_HOURS);
    models = Number.isFinite(models) ? models : benchInput('models', BENCH_MODELS);
    if (!Number.isFinite(hoursMan) || !Number.isFinite(hoursAuto)) {
      const pkgCur = packageHours(models, reusePct, baseManual, baseAuto);
      hoursMan = pkgCur.manual;
      hoursAuto = pkgCur.auto;
    }
    for (let m = minX; m <= maxX; m += 10) {
      const pkg = packageHours(m, reusePct, baseManual, baseAuto);
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
      drawMarketChart(readNum('projectCost') || DEV_COST_DEFAULT);
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
      '<tr><td>Готовых чертежей развёрток</td><td>' + s.reusePct + '%</td></tr>' +
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
      '<div class="result-row"><span class="tag">Отдел</span> ФОТ: <b>' + fmt(s.savingsFotMonth) + ' ₽/мес</b> (' + fmt(s.savingsFotYear) + ' ₽/год)</div>' +
      '<div class="result-row"><span class="tag">Станок</span> Производство: <b>' + fmt(s.savingsFactoryMonth) + ' ₽/мес</b></div>' +
      '<div class="result-row"><span class="tag">Итого</span> Суммарно: <b>' + fmt(s.savingsTotalMonth) + ' ₽/мес</b> · окупаемость <b>' +
      (s.paybackTotal === Infinity ? '—' : s.paybackTotal.toFixed(1)) + ' мес</b></div>' +
      '<div class="result-row"><span class="tag">КП</span> Стоимость внедрения: <b>' + fmt(s.cost) + ' ₽</b> (ввод, не из экономии)</div>' +
      '<div class="result-row"><span class="tag">Цель</span> Потолок при ' + s.targetPayback + ' мес: <b>' + fmt(s.maxPriceTotal) + ' ₽</b> (экономия × срок)</div>' +
      '<p><b>Вывод:</b> ' + s.verdict + '</p>' +

      '<h2>Пошаговый журнал</h2>' + logHtml +
      '<p class="muted">Срок изделия (сварка, покраска) в рублях не считается. Внедрение ' + fmt(s.cost) + ' ₽ — себестоимость исполнителя.</p>' +
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

  function computeExecutiveEconomics(overrides) {
    const p = Object.assign({}, EXEC_DEFAULTS, overrides || {});
    const pkg = packageHours(p.models, p.reusePct, p.hoursManualPkg, p.hoursAutoPkg);
    const hoursSavedPkg = Math.max(0, pkg.manual - pkg.auto);
    const hoursSavedMonth = p.projects * hoursSavedPkg;
    return {
      projects: p.projects,
      models: p.models,
      hoursSavedMonth,
      cost: p.cost
    };
  }

  function renderExecutiveSummary() {
    const el = document.getElementById('execEconomics');
    if (!el) return;
    const e = computeExecutiveEconomics();
    el.innerHTML =
      'При <strong>' + e.projects + ' проектах</strong> в месяц — порядка ' +
      '<strong>' + fmtDec(e.hoursSavedMonth, 0) + ' ч/мес</strong> меньше рутинного прогона пакетов (оценка технологического бюро).';
    window.__docsExecEconomics = e;
  }

  function buildExecutiveSummaryPdf() {
    const e = window.__docsExecEconomics || computeExecutiveEconomics();
    const dateStr = new Date().toLocaleDateString('ru-RU');
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Docs v1 — резюме</title><style>' +
      'body{font:11pt/1.45 Segoe UI,sans-serif;color:#1a2430;max-width:210mm;margin:16mm auto}' +
      'h1{font-size:16pt;margin:0 0 4px}h2{font-size:12pt;margin:20px 0 8px;color:#0e3a5a}' +
      'table{width:100%;border-collapse:collapse;font-size:10pt;margin:8px 0}' +
      'th,td{border:1px solid #d5dbe3;padding:6px 8px;text-align:left;vertical-align:top}' +
      'th{background:#f4f6f8}.ask{background:#f0f5f9;border-left:4px solid #0e3a5a;padding:12px 14px;margin:12px 0}' +
      '.muted{color:#5a6573;font-size:9.5pt}ul{margin:6px 0;padding-left:1.2em}li{margin:4px 0}' +
      '@media print{body{margin:12mm}}</style></head><body>' +
      '<h1>Пакет в цех · Docs v1</h1>' +
      '<p class="muted">ООО «Меркатор Калуга» · материалы к согласованию · ' + dateStr + '</p>' +
      '<div class="ask"><strong>Запрос:</strong> согласовать КП-DOCS-01 (930 000 ₽), ТЗ-DOCS-01 и выделение тестового хранилища PDM для пилотной приёмки (ориентир старта работ — 01.09.2026).</div>' +
      '<h2>Итог замера</h2><ul>' +
      '<li>150 позиций (148 с моделью) → полный пакет за <strong>46 мин</strong> vs 5–10 ч вручную</li>' +
      '<li>148 DXF, 296 стр. PDF, SW 2018 SP3</li></ul>' +
      '<h2>Нагрузка на отдел</h2><p>' +
      'Оценка ТБ: при ' + e.projects + ' проектах/мес — порядка ' + fmtDec(e.hoursSavedMonth, 0) + ' ч/мес меньше рутинного прогона.</p>' +
      '<h2>Коммерческое предложение</h2><ul>' +
      '<li>Полный пакет Docs v1: <strong>930 000 ₽</strong></li>' +
      '<li>Оплата 40% / 40% / 20%</li>' +
      '<li>~46 раб. дней; приёмка ориентир 10.11.2026</li></ul>' +
      '<h2>Критерии приёмки (кратко)</h2><ul>' +
      '<li>Прогон согласованного Excel на тестовом хранилище PDM или в локальной папке</li>' +
      '<li>DXF в подпапках по толщине, контур без фасок и резьб</li>' +
      '<li>PDF-альбом с оглавлением по шифрам из Excel</li>' +
      '<li>Проверка комплекта и флаг неполного альбома до ухода в цех</li>' +
      '<li>Внедрение, обучение, сопровождение после приёмки, приёмка на SW 2018 SP3</li></ul>' +
      '<h2>Участники согласования</h2><table><tr><th>Роль</th><th>Зона ответственности</th></tr>' +
      '<tr><td>Руководство</td><td>Бюджет и решение о запуске проекта</td></tr>' +
      '<tr><td>Технологическое бюро</td><td>Владелец процесса, приёмка</td></tr>' +
      '<tr><td>ИТ</td><td>Тестовое хранилище PDM, установка на рабочие места</td></tr>' +
      '<tr><td>КБ</td><td>Образец Excel, эталонные модели</td></tr></table>' +
      '<p class="muted">Полные условия: ТЗ-DOCS-01, КП-DOCS-01. Демо: alexpror.github.io/solid-dxf-demo/</p>' +
      '</body></html>';
  }

  function exportExecutiveSummaryPdf() {
    const html = buildExecutiveSummaryPdf();
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
    const summaryPdfBtn = document.getElementById('exportSummaryPdf');
    if (summaryPdfBtn) {
      summaryPdfBtn.addEventListener('click', exportExecutiveSummaryPdf);
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
        if (id === 'projectCost') {
          drawMarketChart(readNum('projectCost') || DEV_COST_DEFAULT);
        }
      });
    });
    rangeIds.forEach(id => {
      const out = document.getElementById(id + '-out');
      const el = document.getElementById(id);
      if (out && el) out.textContent = el.value;
    });

    const calcEnabled = !!document.getElementById('calcBtn');
    if (calcEnabled) {
      calc({ scroll: false, flash: false });
      hasCalculated = true;
      const exportBtnInit = document.getElementById('exportPdfBtn');
      if (exportBtnInit) exportBtnInit.disabled = false;
    } else {
      drawChart(BENCH_MODELS);
    }

    drawMarketChart(DEV_COST_DEFAULT);
    renderExecutiveSummary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
