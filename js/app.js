/**
 * ChemConcentration Lab - Main Application Controller
 * Handles user interactions, two-way bindings, state management, and updates
 */

// Application State
const state = {
  currentTab: 'lab',
  concentrationType: 'w/w', // 'w/w', 'w/v', 'v/v'
  calculationMode: 'calculate', // 'calculate', 'prepare'
  liquidMode: 'solvent', // 'solvent' (น้ำ) or 'solution' (รวม)
  selectedChemical: 'cuso4',
  customColorHex: '#a855f7',
  
  // Values for 'calculate' mode
  soluteVal: 10,
  soluteUnit: 'g',
  liquidVal: 190,
  liquidUnit: 'g',

  // Values for 'prepare' mode
  prepTargetPercent: 10,
  prepTargetVolume: 250,
  prepVolumeUnit: 'mL',

  // Quiz state
  currentQuiz: null,
  quizScore: 0,
  quizTotal: 0
};

let simulationInstance = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initChemicalPresets();
  initSimulation();
  bindInputEvents();
  updateFormLabelsAndUnits();
  runCalculation();
  newQuizQuestion();
});

/**
 * Initialize Canvas Simulation
 */
function initSimulation() {
  simulationInstance = new BeakerSimulation('beakerCanvas');
}

/**
 * Initialize Chemical Selector Swatches
 */
function initChemicalPresets() {
  const grid = document.getElementById('chemical-grid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(CHEMICAL_PRESETS).forEach(chem => {
    const btn = document.createElement('button');
    btn.id = `chem-btn-${chem.id}`;
    btn.type = 'button';
    btn.onclick = () => selectChemical(chem.id);
    btn.className = `p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
      chem.id === state.selectedChemical
        ? 'border-blue-500 bg-blue-500/20 text-white shadow-sm'
        : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white'
    }`;

    // Swatch dot
    const swatch = document.createElement('span');
    swatch.className = 'w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm';
    swatch.style.backgroundColor = chem.colorHex;

    const textDiv = document.createElement('div');
    textDiv.className = 'overflow-hidden';
    textDiv.innerHTML = `
      <span class="block text-xs font-semibold truncate">${chem.name.split(' (')[0]}</span>
      <span class="block text-[10px] text-slate-400 font-mono truncate">${chem.formula}</span>
    `;

    btn.appendChild(swatch);
    btn.appendChild(textDiv);
    grid.appendChild(btn);
  });
}

/**
 * Select chemical preset
 */
function selectChemical(chemId) {
  state.selectedChemical = chemId;
  const chem = CHEMICAL_PRESETS[chemId] || CHEMICAL_PRESETS.cuso4;

  // Update UI selection style
  Object.keys(CHEMICAL_PRESETS).forEach(id => {
    const btn = document.getElementById(`chem-btn-${id}`);
    if (btn) {
      if (id === chemId) {
        btn.className = 'p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 border-blue-500 bg-blue-500/20 text-white shadow-sm';
      } else {
        btn.className = 'p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white';
      }
    }
  });

  // Update badges & description
  const badge = document.getElementById('chemical-formula-badge');
  if (badge) badge.textContent = chem.formula;

  const desc = document.getElementById('chemical-desc-text');
  if (desc) desc.textContent = chem.description;

  const beakerName = document.getElementById('beaker-chem-name');
  if (beakerName) beakerName.textContent = `${chem.formula} (${chem.name.split(' (')[0]})`;

  // Auto-switch default units if needed
  if (chem.state === 'liquid' && state.concentrationType === 'v/v') {
    state.soluteUnit = 'mL';
    const sUnit = document.getElementById('solute-unit');
    if (sUnit) sUnit.value = 'mL';
  }

  runCalculation();
}

/**
 * Tab Navigation Switcher
 */
function switchTab(tabId) {
  state.currentTab = tabId;
  const tabs = ['lab', 'steps', 'quiz', 'theory'];

  tabs.forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    const btnEl = document.getElementById(`tab-btn-${t}`);
    if (tabEl) {
      tabEl.classList.toggle('hidden', t !== tabId);
    }
    if (btnEl) {
      if (t === tabId) {
        btnEl.className = 'nav-tab active px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5';
      } else {
        btnEl.className = 'nav-tab px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all flex items-center space-x-1.5';
      }
    }
  });

  if (tabId === 'lab' && simulationInstance) {
    simulationInstance.resize();
  }
}

/**
 * Switch Concentration Type (%w/w, %w/v, %v/v)
 */
function setConcentrationType(type) {
  state.concentrationType = type;

  // Update Buttons
  ['ww', 'wv', 'vv'].forEach(t => {
    const btn = document.getElementById(`btn-type-${t}`);
    const isCurrent = (t === 'ww' && type === 'w/w') || (t === 'wv' && type === 'w/v') || (t === 'vv' && type === 'v/v');
    if (btn) {
      if (isCurrent) {
        btn.className = 'type-btn active px-4 py-2 rounded-xl text-sm font-semibold border border-blue-500 bg-blue-600/30 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2';
        btn.querySelector('span').className = 'w-2.5 h-2.5 rounded-full bg-blue-400';
      } else {
        btn.className = 'type-btn px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center gap-2';
        btn.querySelector('span').className = 'w-2.5 h-2.5 rounded-full bg-slate-500';
      }
    }
  });

  updateFormLabelsAndUnits();
  runCalculation();
}

/**
 * Switch Calculation Mode ('calculate' vs 'prepare')
 */
function setCalculationMode(mode) {
  state.calculationMode = mode;
  const calcBtn = document.getElementById('mode-calc');
  const prepBtn = document.getElementById('mode-prep');
  const calcPanel = document.getElementById('panel-calculate-inputs');
  const prepPanel = document.getElementById('panel-prepare-inputs');

  if (mode === 'calculate') {
    calcBtn.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-blue-600 text-white transition-all';
    prepBtn.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all';
    calcPanel.classList.remove('hidden');
    prepPanel.classList.add('hidden');
  } else {
    prepBtn.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-blue-600 text-white transition-all';
    calcBtn.className = 'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all';
    prepPanel.classList.remove('hidden');
    calcPanel.classList.add('hidden');
  }

  runCalculation();
}

/**
 * Switch Liquid Mode (Solvent vs Total Solution)
 */
function setLiquidMode(mode) {
  state.liquidMode = mode;
  const solventBtn = document.getElementById('toggle-solvent');
  const solutionBtn = document.getElementById('toggle-solution');
  const liquidLabel = document.getElementById('liquid-label');

  if (mode === 'solvent') {
    solventBtn.className = 'px-2.5 py-1 rounded-md bg-blue-600 text-white font-medium transition-all';
    solutionBtn.className = 'px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 transition-all';
    liquidLabel.innerHTML = `<span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> ปริมาณตัวทำละลาย (น้ำ)`;
  } else {
    solutionBtn.className = 'px-2.5 py-1 rounded-md bg-blue-600 text-white font-medium transition-all';
    solventBtn.className = 'px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 transition-all';
    liquidLabel.innerHTML = `<span class="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> ปริมาณสารละลายรวม (ทั้งหมด)`;
  }

  runCalculation();
}

/**
 * Update Form Labels, Sliders, and Units based on % type
 */
function updateFormLabelsAndUnits() {
  const formulaDisplay = document.getElementById('formula-text-display');
  const formulaHint = document.getElementById('formula-hint');
  const soluteLabel = document.getElementById('solute-label');
  const soluteUnit = document.getElementById('solute-unit');
  const liquidUnit = document.getElementById('liquid-unit');
  const prepVolLabel = document.getElementById('prep-volume-label');
  const prepVolUnit = document.getElementById('prep-volume-unit');

  if (state.concentrationType === 'w/w') {
    formulaDisplay.textContent = '%w/w = [มวลตัวละลาย (g) ÷ มวลสารละลาย (g)] × 100%';
    formulaHint.textContent = '*มวลสารละลาย = มวลตัวละลาย + มวลตัวทำละลาย (หน่วยมวลกรัม)';
    soluteLabel.innerHTML = `<span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> มวลของตัวละลาย (Solute)`;
    soluteUnit.innerHTML = `
      <option value="g">กรัม (g)</option>
      <option value="kg">กิโลกรัม (kg)</option>
      <option value="mg">มิลลิกรัม (mg)</option>
    `;
    soluteUnit.value = 'g';
    liquidUnit.innerHTML = `
      <option value="g">กรัม (g)</option>
      <option value="kg">กิโลกรัม (kg)</option>
    `;
    liquidUnit.value = 'g';
    prepVolLabel.innerHTML = `<i class="ph-fill ph-scales text-blue-400"></i> มวลสารละลายที่ต้องการเตรียม`;
    prepVolUnit.innerHTML = `<option value="g">กรัม (g)</option><option value="kg">กิโลกรัม (kg)</option>`;
  } else if (state.concentrationType === 'w/v') {
    formulaDisplay.textContent = '%w/v = [มวลตัวละลาย (g) ÷ ปริมาตรสารละลาย (cm³ หรือ mL)] × 100%';
    formulaHint.textContent = '*ปริมาตรสารละลายมีหน่วยเป็น cm³ หรือ mL (1 mL = 1 cm³)';
    soluteLabel.innerHTML = `<span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> มวลของตัวละลาย (Solute)`;
    soluteUnit.innerHTML = `
      <option value="g">กรัม (g)</option>
      <option value="kg">กิโลกรัม (kg)</option>
    `;
    soluteUnit.value = 'g';
    liquidUnit.innerHTML = `
      <option value="mL">มิลลิลิตร (mL)</option>
      <option value="cm³">ลูกบาศก์เซนติเมตร (cm³)</option>
      <option value="L">ลิตร (L)</option>
    `;
    liquidUnit.value = 'mL';
    prepVolLabel.innerHTML = `<i class="ph-fill ph-flask text-blue-400"></i> ปริมาตรสารละลายที่ต้องการเตรียม`;
    prepVolUnit.innerHTML = `<option value="mL">มิลลิลิตร (mL)</option><option value="L">ลิตร (L)</option>`;
  } else if (state.concentrationType === 'v/v') {
    formulaDisplay.textContent = '%v/v = [ปริมาตรตัวละลาย (mL) ÷ ปริมาตรสารละลาย (mL)] × 100%';
    formulaHint.textContent = '*ทั้งตัวละลายและสารละลายเป็นของเหลว วัดปริมาตรเป็น mL หรือ cm³';
    soluteLabel.innerHTML = `<span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> ปริมาตรตัวละลาย (Solute)`;
    soluteUnit.innerHTML = `
      <option value="mL">มิลลิลิตร (mL)</option>
      <option value="cm³">ลูกบาศก์เซนติเมตร (cm³)</option>
      <option value="L">ลิตร (L)</option>
    `;
    soluteUnit.value = 'mL';
    liquidUnit.innerHTML = `
      <option value="mL">มิลลิลิตร (mL)</option>
      <option value="cm³">ลูกบาศก์เซนติเมตร (cm³)</option>
      <option value="L">ลิตร (L)</option>
    `;
    liquidUnit.value = 'mL';
    prepVolLabel.innerHTML = `<i class="ph-fill ph-flask text-blue-400"></i> ปริมาตรสารละลายที่ต้องการเตรียม`;
    prepVolUnit.innerHTML = `<option value="mL">มิลลิลิตร (mL)</option><option value="L">ลิตร (L)</option>`;
  }
}

/**
 * Bind 2-way events between sliders and number inputs
 */
function bindInputEvents() {
  const soluteNum = document.getElementById('solute-num');
  const soluteSlider = document.getElementById('solute-slider');
  const soluteSliderVal = document.getElementById('solute-slider-val');
  const soluteUnit = document.getElementById('solute-unit');

  const liquidNum = document.getElementById('liquid-num');
  const liquidSlider = document.getElementById('liquid-slider');
  const liquidSliderVal = document.getElementById('liquid-slider-val');
  const liquidUnit = document.getElementById('liquid-unit');

  // Solute sync
  soluteNum.addEventListener('input', () => {
    const val = parseFloat(soluteNum.value) || 0;
    state.soluteVal = val;
    soluteSlider.value = Math.min(100, Math.max(0.5, val));
    soluteSliderVal.textContent = `${val} ${state.soluteUnit}`;
    runCalculation();
  });

  soluteSlider.addEventListener('input', () => {
    const val = parseFloat(soluteSlider.value) || 0;
    state.soluteVal = val;
    soluteNum.value = val;
    soluteSliderVal.textContent = `${val} ${state.soluteUnit}`;
    runCalculation();
  });

  soluteUnit.addEventListener('change', () => {
    state.soluteUnit = soluteUnit.value;
    soluteSliderVal.textContent = `${state.soluteVal} ${state.soluteUnit}`;
    runCalculation();
  });

  // Liquid sync
  liquidNum.addEventListener('input', () => {
    const val = parseFloat(liquidNum.value) || 0;
    state.liquidVal = val;
    liquidSlider.value = Math.min(500, Math.max(10, val));
    liquidSliderVal.textContent = `${val} ${state.liquidUnit}`;
    runCalculation();
  });

  liquidSlider.addEventListener('input', () => {
    const val = parseFloat(liquidSlider.value) || 0;
    state.liquidVal = val;
    liquidNum.value = val;
    liquidSliderVal.textContent = `${val} ${state.liquidUnit}`;
    runCalculation();
  });

  liquidUnit.addEventListener('change', () => {
    state.liquidUnit = liquidUnit.value;
    liquidSliderVal.textContent = `${state.liquidVal} ${state.liquidUnit}`;
    runCalculation();
  });

  // Prepare mode sync
  const prepTargetPercent = document.getElementById('prep-target-percent');
  const prepPercentSlider = document.getElementById('prep-percent-slider');
  const prepTargetVolume = document.getElementById('prep-target-volume');
  const prepVolumeSlider = document.getElementById('prep-volume-slider');
  const prepVolumeUnit = document.getElementById('prep-volume-unit');

  prepTargetPercent.addEventListener('input', () => {
    const val = parseFloat(prepTargetPercent.value) || 0;
    state.prepTargetPercent = val;
    prepPercentSlider.value = val;
    runCalculation();
  });

  prepPercentSlider.addEventListener('input', () => {
    const val = parseFloat(prepPercentSlider.value) || 0;
    state.prepTargetPercent = val;
    prepTargetPercent.value = val;
    runCalculation();
  });

  prepTargetVolume.addEventListener('input', () => {
    const val = parseFloat(prepTargetVolume.value) || 0;
    state.prepTargetVolume = val;
    prepVolumeSlider.value = val;
    runCalculation();
  });

  prepVolumeSlider.addEventListener('input', () => {
    const val = parseFloat(prepVolumeSlider.value) || 0;
    state.prepTargetVolume = val;
    prepTargetVolume.value = val;
    runCalculation();
  });

  prepVolumeUnit.addEventListener('change', () => {
    state.prepVolumeUnit = prepVolumeUnit.value;
    runCalculation();
  });
}

/**
 * Main Calculation Dispatcher & UI Update
 */
function runCalculation() {
  let result;
  const isCalcMode = state.calculationMode === 'calculate';

  if (isCalcMode) {
    result = calculateConcentration({
      type: state.concentrationType,
      solute: state.soluteVal,
      soluteUnit: state.soluteUnit,
      liquid: state.liquidVal,
      liquidUnit: state.liquidUnit,
      liquidMode: state.liquidMode
    });
  } else {
    result = calculatePreparation({
      type: state.concentrationType,
      targetPercent: state.prepTargetPercent,
      targetVolume: state.prepTargetVolume,
      volumeUnit: state.prepVolumeUnit
    });
  }

  // Update Display elements
  const percentDisplay = document.getElementById('result-percentage-display');
  const unitDisplay = document.getElementById('result-unit-display');
  const interpretationDisplay = document.getElementById('result-interpretation');
  const statusTag = document.getElementById('concentration-status-tag');
  const miniSolute = document.getElementById('mini-solute-val');
  const miniSolvent = document.getElementById('mini-solvent-val');
  const miniSolution = document.getElementById('mini-solution-val');

  if (isCalcMode) {
    if (!result.isValid) {
      percentDisplay.textContent = '0.00';
      unitDisplay.textContent = `%${state.concentrationType}`;
      interpretationDisplay.textContent = result.error || 'ข้อมูลไม่ถูกต้อง';
      statusTag.className = 'badge-tag bg-rose-500/20 text-rose-300 border border-rose-500/40';
      statusTag.textContent = 'ระบุข้อมูลไม่ถูกต้อง';
      return;
    }

    const pct = result.percentage;
    percentDisplay.textContent = pct.toFixed(2);
    unitDisplay.textContent = `%${state.concentrationType}`;
    interpretationDisplay.textContent = result.interpretation;

    // Status Tag logic
    if (pct <= 5) {
      statusTag.className = 'badge-tag bg-blue-500/20 text-blue-300 border border-blue-500/40';
      statusTag.textContent = 'เจือจาง (Dilute)';
    } else if (pct <= 20) {
      statusTag.className = 'badge-tag bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
      statusTag.textContent = 'ปานกลาง (Moderate)';
    } else if (pct <= 35) {
      statusTag.className = 'badge-tag bg-amber-500/20 text-amber-300 border border-amber-500/40';
      statusTag.textContent = 'เข้มข้นสูง (Concentrated)';
    } else {
      statusTag.className = 'badge-tag bg-rose-500/20 text-rose-300 border border-rose-500/40';
      statusTag.textContent = 'เข้มข้นจัด / ใกล้จุดอิ่มตัว';
    }

    // Mini cards
    miniSolute.textContent = `${result.soluteStandard} ${state.concentrationType === 'v/v' ? 'mL' : 'g'}`;
    miniSolvent.textContent = `${result.solventStandard} ${state.concentrationType === 'v/v' ? 'mL' : 'g'}`;
    miniSolution.textContent = `${result.solutionStandard} ${state.concentrationType === 'v/v' ? 'mL' : 'g'}`;

    // Update simulation
    if (simulationInstance) {
      simulationInstance.update({
        solute: result.soluteStandard,
        totalVolume: result.totalVolumeApprox,
        percentage: result.percentage,
        chemicalId: state.selectedChemical,
        customColorHex: state.customColorHex
      });
    }

    // Update Step-by-Step list
    renderStepByStep(result.steps);
  } else {
    // Prep mode
    if (!result.isValid) {
      percentDisplay.textContent = '0.00';
      unitDisplay.textContent = 'ต้องใช้';
      interpretationDisplay.textContent = result.error;
      return;
    }

    percentDisplay.textContent = result.soluteNeeded;
    unitDisplay.textContent = result.soluteUnit;
    interpretationDisplay.innerHTML = `เพื่อเตรียมสารละลายความเข้มข้น <b>${state.prepTargetPercent}%</b> ปริมาณ <b>${state.prepTargetVolume} ${state.prepVolumeUnit}</b> จะต้องใช้ตัวละลาย <b>${result.soluteNeeded} ${result.soluteUnit}</b>`;
    statusTag.className = 'badge-tag bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    statusTag.textContent = 'คำนวณการเตรียมสาร';

    miniSolute.textContent = `${result.soluteNeeded} ${result.soluteUnit}`;
    miniSolvent.textContent = `${result.solventNeeded} ${result.solventUnit}`;
    miniSolution.textContent = `${state.prepTargetVolume} ${state.prepVolumeUnit}`;

    // Update simulation
    if (simulationInstance) {
      const approxVol = toMilliliters(state.prepTargetVolume, state.prepVolumeUnit);
      simulationInstance.update({
        solute: result.soluteNeeded,
        totalVolume: approxVol,
        percentage: state.prepTargetPercent,
        chemicalId: state.selectedChemical,
        customColorHex: state.customColorHex
      });
    }

    renderStepByStep(result.steps);
  }
}

/**
 * Render Step-by-Step Breakdown cards
 */
function renderStepByStep(steps) {
  const container = document.getElementById('steps-container');
  if (!container) return;

  if (!steps || steps.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-xs">ไม่มีขั้นตอนการคำนวณ</p>';
    return;
  }

  container.innerHTML = steps.map((s, idx) => `
    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1.5 transition-all hover:border-slate-600">
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
          ${idx + 1}
        </span>
        <h4 class="text-xs sm:text-sm font-semibold text-slate-200">${s.title}</h4>
      </div>
      <p class="text-xs sm:text-sm text-slate-300 font-mono-math pl-8 whitespace-pre-line leading-relaxed text-blue-200">
        ${s.detail}
      </p>
    </div>
  `).join('');
}

/**
 * Quick Beaker Action Handlers
 */
function stirSolution() {
  if (simulationInstance) {
    simulationInstance.triggerStir();
  }
}

function quickAddWater(amountML = 50) {
  if (state.calculationMode === 'calculate') {
    const liquidNum = document.getElementById('liquid-num');
    const cur = parseFloat(liquidNum.value) || 0;
    liquidNum.value = cur + amountML;
    liquidNum.dispatchEvent(new Event('input'));
  } else {
    const prepVol = document.getElementById('prep-target-volume');
    const cur = parseFloat(prepVol.value) || 0;
    prepVol.value = cur + amountML;
    prepVol.dispatchEvent(new Event('input'));
  }
  stirSolution();
}

function quickAddSolute(amount = 5) {
  if (state.calculationMode === 'calculate') {
    const soluteNum = document.getElementById('solute-num');
    const cur = parseFloat(soluteNum.value) || 0;
    soluteNum.value = cur + amount;
    soluteNum.dispatchEvent(new Event('input'));
  } else {
    const prepPct = document.getElementById('prep-target-percent');
    const cur = parseFloat(prepPct.value) || 0;
    prepPct.value = Math.min(95, cur + 2);
    prepPct.dispatchEvent(new Event('input'));
  }
  stirSolution();
}

/**
 * Load Real-life Preset Examples
 */
function loadPresetExample(type) {
  setCalculationMode('calculate');

  if (type === 'saline') {
    // 0.9% w/v NaCl
    setConcentrationType('w/v');
    selectChemical('nacl');
    document.getElementById('solute-num').value = 0.9;
    document.getElementById('solute-unit').value = 'g';
    document.getElementById('liquid-num').value = 100;
    document.getElementById('liquid-unit').value = 'mL';
  } else if (type === 'alcohol') {
    // 70% v/v Ethanol
    setConcentrationType('v/v');
    selectChemical('ethanol');
    setLiquidMode('solution');
    document.getElementById('solute-num').value = 70;
    document.getElementById('solute-unit').value = 'mL';
    document.getElementById('liquid-num').value = 100;
    document.getElementById('liquid-unit').value = 'mL';
  } else if (type === 'syrup') {
    // 25% w/w Sugar
    setConcentrationType('w/w');
    selectChemical('sugar');
    setLiquidMode('solvent');
    document.getElementById('solute-num').value = 50;
    document.getElementById('solute-unit').value = 'g';
    document.getElementById('liquid-num').value = 150;
    document.getElementById('liquid-unit').value = 'g';
  } else if (type === 'vinegar') {
    // 5% v/v
    setConcentrationType('v/v');
    selectChemical('food_green');
    setLiquidMode('solution');
    document.getElementById('solute-num').value = 10;
    document.getElementById('solute-unit').value = 'mL';
    document.getElementById('liquid-num').value = 200;
    document.getElementById('liquid-unit').value = 'mL';
  }

  document.getElementById('solute-num').dispatchEvent(new Event('input'));
  document.getElementById('liquid-num').dispatchEvent(new Event('input'));
  stirSolution();
}

/**
 * Practice Quiz Functions
 */
function newQuizQuestion() {
  state.currentQuiz = generateRandomQuiz();
  const qText = document.getElementById('quiz-question-text');
  const qUnit = document.getElementById('quiz-answer-unit');
  const qAnswer = document.getElementById('quiz-user-answer');
  const feedback = document.getElementById('quiz-feedback-box');

  if (qText) qText.textContent = state.currentQuiz.question;
  if (qUnit) qUnit.textContent = state.currentQuiz.unit;
  if (qAnswer) {
    qAnswer.value = '';
    qAnswer.focus();
  }
  if (feedback) {
    feedback.className = 'hidden';
    feedback.innerHTML = '';
  }
}

function checkQuizAnswer() {
  if (!state.currentQuiz) return;
  const userVal = parseFloat(document.getElementById('quiz-user-answer').value);
  const feedback = document.getElementById('quiz-feedback-box');
  const scoreEl = document.getElementById('quiz-score');
  const totalEl = document.getElementById('quiz-total');

  if (isNaN(userVal)) {
    feedback.className = 'p-4 rounded-xl border border-amber-500/40 bg-amber-900/20 text-amber-200 text-sm';
    feedback.innerHTML = '⚠ กรุณากรอกตัวเลขคำตอบก่อนกดตรวจ';
    feedback.classList.remove('hidden');
    return;
  }

  state.quizTotal++;
  const correct = state.currentQuiz.correctAnswer;
  // allow 0.1 tolerance for rounding
  const isCorrect = Math.abs(userVal - correct) <= 0.15;

  if (isCorrect) {
    state.quizScore++;
    feedback.className = 'p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-sm space-y-2';
    feedback.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-emerald-400">
        <i class="ph-bold ph-check-circle text-lg"></i> ยอดเยี่ยม! คำตอบถูกต้อง (${correct} ${state.currentQuiz.unit})
      </div>
      <p class="text-xs text-slate-300 whitespace-pre-line font-mono-math pl-6">${state.currentQuiz.explanation}</p>
      <div class="pt-2">
        <button onclick="newQuizQuestion()" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">
          ทำข้อถัดไป →
        </button>
      </div>
    `;
  } else {
    feedback.className = 'p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm space-y-2';
    feedback.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-rose-400">
        <i class="ph-bold ph-x-circle text-lg"></i> ยังไม่ถูกต้อง คำตอบที่ถูกต้องคือ: ${correct} ${state.currentQuiz.unit}
      </div>
      <p class="text-xs text-slate-300 whitespace-pre-line font-mono-math pl-6">${state.currentQuiz.explanation}</p>
      <div class="pt-2">
        <button onclick="newQuizQuestion()" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold">
          ลองข้อใหม่ →
        </button>
      </div>
    `;
  }

  scoreEl.textContent = state.quizScore;
  totalEl.textContent = state.quizTotal;
  feedback.classList.remove('hidden');
}
