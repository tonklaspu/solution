/**
 * Concentration Calculator & Educational Step-by-Step Engine
 */

// Unit conversion factors to base unit (g for mass, mL for volume)
const MASS_TO_G = {
  g: 1,
  kg: 1000,
  mg: 0.001
};

const VOL_TO_ML = {
  mL: 1,
  'cm³': 1,
  L: 1000,
  'dm³': 1000
};

/**
 * Standardize mass to grams (g)
 */
function toGrams(value, unit = 'g') {
  return (parseFloat(value) || 0) * (MASS_TO_G[unit] || 1);
}

/**
 * Standardize volume to milliliters (mL / cm³)
 */
function toMilliliters(value, unit = 'mL') {
  return (parseFloat(value) || 0) * (VOL_TO_ML[unit] || 1);
}

/**
 * Calculate concentration %
 * @param {Object} params
 * @param {string} params.type - 'w/w', 'w/v', 'v/v'
 * @param {number} params.solute - amount of solute
 * @param {string} params.soluteUnit - unit of solute
 * @param {number} params.liquid - amount of solvent or total solution
 * @param {string} params.liquidUnit - unit of solvent or total solution
 * @param {string} params.liquidMode - 'solvent' (ตัวทำละลาย) or 'solution' (สารละลายรวม)
 * @returns {Object} Result object with concentration, intermediate values, and steps
 */
function calculateConcentration({ type, solute, soluteUnit, liquid, liquidUnit, liquidMode }) {
  const soluteVal = parseFloat(solute) || 0;
  const liquidVal = parseFloat(liquid) || 0;

  if (soluteVal <= 0 || liquidVal <= 0) {
    return {
      isValid: false,
      error: 'กรุณากรอกปริมาณสารที่มากกว่า 0',
      percentage: 0
    };
  }

  let soluteStandard = 0; // g or mL
  let solutionStandard = 0; // g or mL
  let solventStandard = 0; // g or mL
  let formulaText = '';
  let unitText = '';
  let interpretation = '';
  let steps = [];

  if (type === 'w/w') {
    soluteStandard = toGrams(soluteVal, soluteUnit);
    unitText = '% โดยมวล (%w/w)';
    formulaText = 'ร้อยละโดยมวล (%w/w) = [มวลของตัวละลาย (g) ÷ มวลของสารละลาย (g)] × 100%';

    if (liquidMode === 'solvent') {
      solventStandard = toGrams(liquidVal, liquidUnit);
      solutionStandard = soluteStandard + solventStandard;
      steps.push({
        title: 'ขั้นตอนที่ 1: หามวลรวมของสารละลาย',
        detail: `มวลสารละลาย = มวลตัวละลาย + มวลตัวทำละลาย = ${soluteStandard.toLocaleString()} g + ${solventStandard.toLocaleString()} g = ${solutionStandard.toLocaleString()} g`
      });
    } else {
      solutionStandard = toGrams(liquidVal, liquidUnit);
      solventStandard = Math.max(0, solutionStandard - soluteStandard);
      steps.push({
        title: 'ขั้นตอนที่ 1: ตรวจสอบมวลรวมของสารละลาย',
        detail: `มวลของสารละลายรวม = ${solutionStandard.toLocaleString()} g (ประกอบด้วยตัวละลาย ${soluteStandard.toLocaleString()} g และตัวทำละลาย ${solventStandard.toLocaleString()} g)`
      });
    }

    if (soluteStandard > solutionStandard) {
      return {
        isValid: false,
        error: 'มวลตัวละลายต้องไม่มากกว่ามวลของสารละลายรวม',
        percentage: 0
      };
    }

    const percentage = (soluteStandard / solutionStandard) * 100;

    steps.push({
      title: 'ขั้นตอนที่ 2: แทนค่าลงในสูตรคำนวณ',
      detail: `%w/w = (${soluteStandard.toLocaleString()} g ÷ ${solutionStandard.toLocaleString()} g) × 100%`
    });
    steps.push({
      title: 'ขั้นตอนที่ 3: คำนวณผลลัพธ์',
      detail: `%w/w = ${(soluteStandard / solutionStandard).toFixed(4)} × 100% = ${percentage.toFixed(2)}% โดยมวล`
    });

    interpretation = `หมายความว่า ในสารละลาย 100 กรัม จะมีตัวละลายอยู่ ${percentage.toFixed(2)} กรัม และมีตัวทำละลายอยู่ ${(100 - percentage).toFixed(2)} กรัม`;

    return {
      isValid: true,
      type,
      percentage: Number(percentage.toFixed(2)),
      soluteStandard,
      solutionStandard,
      solventStandard,
      formulaText,
      unitText,
      interpretation,
      steps,
      totalVolumeApprox: solutionStandard // approx 1g = 1mL for water solutions
    };
  } else if (type === 'w/v') {
    soluteStandard = toGrams(soluteVal, soluteUnit); // in g
    solutionStandard = toMilliliters(liquidVal, liquidUnit); // in mL or cm³
    unitText = '% โดยมวลต่อปริมาตร (%w/v)';
    formulaText = 'ร้อยละโดยมวลต่อปริมาตร (%w/v) = [มวลของตัวละลาย (g) ÷ ปริมาตรของสารละลาย (cm³ หรือ mL)] × 100%';

    steps.push({
      title: 'ขั้นตอนที่ 1: แปลงหน่วยให้ตรงตามสูตร',
      detail: `มวลตัวละลาย = ${soluteVal} ${soluteUnit} → ${soluteStandard.toLocaleString()} g\nปริมาตรสารละลาย = ${liquidVal} ${liquidUnit} → ${solutionStandard.toLocaleString()} mL (cm³)`
    });

    const percentage = (soluteStandard / solutionStandard) * 100;

    steps.push({
      title: 'ขั้นตอนที่ 2: แทนค่าลงในสูตรคำนวณ',
      detail: `%w/v = (${soluteStandard.toLocaleString()} g ÷ ${solutionStandard.toLocaleString()} mL) × 100%`
    });
    steps.push({
      title: 'ขั้นตอนที่ 3: คำนวณผลลัพธ์',
      detail: `%w/v = ${(soluteStandard / solutionStandard).toFixed(4)} × 100% = ${percentage.toFixed(2)}% โดยมวลต่อปริมาตร`
    });

    interpretation = `หมายความว่า ในสารละลาย 100 ลูกบาศก์เซนติเมตร (mL) จะมีตัวละลายอยู่ ${percentage.toFixed(2)} กรัม`;

    return {
      isValid: true,
      type,
      percentage: Number(percentage.toFixed(2)),
      soluteStandard,
      solutionStandard,
      solventStandard: solutionStandard,
      formulaText,
      unitText,
      interpretation,
      steps,
      totalVolumeApprox: solutionStandard
    };
  } else if (type === 'v/v') {
    soluteStandard = toMilliliters(soluteVal, soluteUnit); // in mL
    unitText = '% โดยปริมาตร (%v/v)';
    formulaText = 'ร้อยละโดยปริมาตร (%v/v) = [ปริมาตรของตัวละลาย (mL) ÷ ปริมาตรของสารละลาย (mL)] × 100%';

    if (liquidMode === 'solvent') {
      solventStandard = toMilliliters(liquidVal, liquidUnit);
      solutionStandard = soluteStandard + solventStandard;
      steps.push({
        title: 'ขั้นตอนที่ 1: หาปริมาตรรวมของสารละลาย',
        detail: `ปริมาตรสารละลาย = ปริมาตรตัวละลาย + ปริมาตรตัวทำละลาย = ${soluteStandard.toLocaleString()} mL + ${solventStandard.toLocaleString()} mL = ${solutionStandard.toLocaleString()} mL`
      });
    } else {
      solutionStandard = toMilliliters(liquidVal, liquidUnit);
      solventStandard = Math.max(0, solutionStandard - soluteStandard);
      steps.push({
        title: 'ขั้นตอนที่ 1: ตรวจสอบปริมาตรรวมของสารละลาย',
        detail: `ปริมาตรของสารละลายรวม = ${solutionStandard.toLocaleString()} mL (ประกอบด้วยตัวละลาย ${soluteStandard.toLocaleString()} mL และตัวทำละลาย ${solventStandard.toLocaleString()} mL)`
      });
    }

    if (soluteStandard > solutionStandard) {
      return {
        isValid: false,
        error: 'ปริมาตรตัวละลายต้องไม่มากกว่าปริมาตรของสารละลายรวม',
        percentage: 0
      };
    }

    const percentage = (soluteStandard / solutionStandard) * 100;

    steps.push({
      title: 'ขั้นตอนที่ 2: แทนค่าลงในสูตรคำนวณ',
      detail: `%v/v = (${soluteStandard.toLocaleString()} mL ÷ ${solutionStandard.toLocaleString()} mL) × 100%`
    });
    steps.push({
      title: 'ขั้นตอนที่ 3: คำนวณผลลัพธ์',
      detail: `%v/v = ${(soluteStandard / solutionStandard).toFixed(4)} × 100% = ${percentage.toFixed(2)}% โดยปริมาตร`
    });

    interpretation = `หมายความว่า ในสารละลาย 100 มิลลิลิตร (mL) จะมีตัวละลายอยู่ ${percentage.toFixed(2)} มิลลิลิตร และมีตัวทำละลายอยู่ ${(100 - percentage).toFixed(2)} มิลลิลิตร`;

    return {
      isValid: true,
      type,
      percentage: Number(percentage.toFixed(2)),
      soluteStandard,
      solutionStandard,
      solventStandard,
      formulaText,
      unitText,
      interpretation,
      steps,
      totalVolumeApprox: solutionStandard
    };
  }

  return { isValid: false, error: 'ไม่พบประเภทความเข้มข้นที่เลือก' };
}

/**
 * Calculate amount of solute needed to prepare solution (Reverse mode / Lab preparation)
 */
function calculatePreparation({ type, targetPercent, targetVolume, volumeUnit }) {
  const percent = parseFloat(targetPercent) || 0;
  const vol = parseFloat(targetVolume) || 0;

  if (percent <= 0 || vol <= 0) {
    return { isValid: false, error: 'กรุณากรอกค่าที่มากกว่า 0' };
  }

  let soluteNeeded = 0;
  let soluteUnit = 'g';
  let solventNeeded = 0;
  let solventUnit = 'mL';
  let steps = [];

  if (type === 'w/w') {
    const totalMass = toGrams(vol, volumeUnit);
    soluteNeeded = (percent / 100) * totalMass;
    solventNeeded = totalMass - soluteNeeded;
    soluteUnit = 'g';
    solventUnit = 'g';

    steps.push({
      title: 'สูตรที่ใช้',
      detail: `มวลตัวละลาย = (%w/w × มวลสารละลาย) ÷ 100`
    });
    steps.push({
      title: 'แทนค่า',
      detail: `มวลตัวละลาย = (${percent} × ${totalMass} g) ÷ 100 = ${soluteNeeded.toFixed(2)} g`
    });
    steps.push({
      title: 'วิธีเตรียมในห้องแล็บ',
      detail: `ชั่งตัวละลายมา ${soluteNeeded.toFixed(2)} g แล้วเติมน้ำ (ตัวทำละลาย) อีก ${solventNeeded.toFixed(2)} g ให้ได้มวลรวม ${totalMass} g พอดี`
    });
  } else if (type === 'w/v') {
    const totalVol = toMilliliters(vol, volumeUnit);
    soluteNeeded = (percent / 100) * totalVol;
    soluteUnit = 'g';
    solventUnit = 'mL';

    steps.push({
      title: 'สูตรที่ใช้',
      detail: `มวลตัวละลาย (g) = (%w/v × ปริมาตรสารละลาย (mL)) ÷ 100`
    });
    steps.push({
      title: 'แทนค่า',
      detail: `มวลตัวละลาย = (${percent} × ${totalVol} mL) ÷ 100 = ${soluteNeeded.toFixed(2)} g`
    });
    steps.push({
      title: 'วิธีเตรียมในห้องแล็บ',
      detail: `ชั่งตัวละลายมา ${soluteNeeded.toFixed(2)} g ใส่ในบีกเกอร์หรือขวดวัดปริมาตร แล้วเติมน้ำทีละน้อยคนจนละลายหมด จากนั้นปรับปริมาตรสารละลายสุดท้ายให้ครบ ${totalVol} mL พอดี`
    });
  } else if (type === 'v/v') {
    const totalVol = toMilliliters(vol, volumeUnit);
    soluteNeeded = (percent / 100) * totalVol;
    solventNeeded = totalVol - soluteNeeded;
    soluteUnit = 'mL';
    solventUnit = 'mL';

    steps.push({
      title: 'สูตรที่ใช้',
      detail: `ปริมาตรตัวละลาย (mL) = (%v/v × ปริมาตรสารละลาย (mL)) ÷ 100`
    });
    steps.push({
      title: 'แทนค่า',
      detail: `ปริมาตรตัวละลาย = (${percent} × ${totalVol} mL) ÷ 100 = ${soluteNeeded.toFixed(2)} mL`
    });
    steps.push({
      title: 'วิธีเตรียมในห้องแล็บ',
      detail: `ตวงของเหลวตัวละลายมา ${soluteNeeded.toFixed(2)} mL ผสมกับตัวทำละลาย ${solventNeeded.toFixed(2)} mL แล้วปรับปริมาตรรวมเป็น ${totalVol} mL`
    });
  }

  return {
    isValid: true,
    type,
    soluteNeeded: Number(soluteNeeded.toFixed(2)),
    soluteUnit,
    solventNeeded: Number(solventNeeded.toFixed(2)),
    solventUnit,
    steps
  };
}

/**
 * Quiz Questions Generator
 */
const QUIZ_TEMPLATES = [
  {
    type: 'w/w',
    template: (solute, solvent) => ({
      question: `ละลายน้ำตาลทราย ${solute} กรัม ในน้ำ ${solvent} กรัม สารละลายน้ำเชื่อมนี้มีความเข้มข้นร้อยละเท่าใดโดยมวล (%w/w)?`,
      solute,
      solvent,
      solution: solute + solvent,
      correctAnswer: Number(((solute / (solute + solvent)) * 100).toFixed(2)),
      unit: '%w/w',
      explanation: `มวลสารละลาย = ${solute} + ${solvent} = ${solute + solvent} กรัม\n%w/w = (${solute} / ${solute + solvent}) × 100% = ${((solute / (solute + solvent)) * 100).toFixed(2)}%`
    })
  },
  {
    type: 'w/v',
    template: (solute, volume) => ({
      question: `ละลายจุนสี (CuSO₄) ${solute} กรัม ในน้ำจนได้สารละลายปริมาตร ${volume} ลูกบาศก์เซนติเมตร (cm³) สารละลายนี้มีความเข้มข้นร้อยละเท่าใดโดยมวลต่อปริมาตร (%w/v)?`,
      solute,
      volume,
      solution: volume,
      correctAnswer: Number(((solute / volume) * 100).toFixed(2)),
      unit: '%w/v',
      explanation: `%w/v = (มวลตัวละลาย g ÷ ปริมาตรสารละลาย cm³) × 100%\n%w/v = (${solute} ÷ ${volume}) × 100% = ${((solute / volume) * 100).toFixed(2)}%`
    })
  },
  {
    type: 'v/v',
    template: (solute, solution) => ({
      question: `ต้องการเตรียมสารละลายแอลกอฮอล์ โดยตวงเอทานอลบริสุทธิ์ ${solute} มิลลิลิตร แล้วเติมน้ำจนได้สารละลายรวม ${solution} มิลลิลิตร สารละลายนี้มีความเข้มข้นร้อยละเท่าใดโดยปริมาตร (%v/v)?`,
      solute,
      solution,
      correctAnswer: Number(((solute / solution) * 100).toFixed(2)),
      unit: '%v/v',
      explanation: `%v/v = (ปริมาตรตัวละลาย ÷ ปริมาตรสารละลาย) × 100%\n%v/v = (${solute} ÷ ${solution}) × 100% = ${((solute / solution) * 100).toFixed(2)}%`
    })
  },
  {
    type: 'w/v_prep',
    template: (percent, volume) => {
      const solute = Number(((percent / 100) * volume).toFixed(2));
      return {
        question: `ถ้าต้องการเตรียมสารละลายเกลือแกง (NaCl) เข้มข้น ${percent}% โดยมวลต่อปริมาตร (%w/v) ปริมาตร ${volume} มิลลิลิตร จะต้องใช้เกลือแกงกี่กรัม?`,
        percent,
        volume,
        correctAnswer: solute,
        unit: 'กรัม (g)',
        explanation: `มวลตัวละลาย = (%w/v × ปริมาตรสารละลาย) ÷ 100\nมวลตัวละลาย = (${percent} × ${volume}) ÷ 100 = ${solute} กรัม`
      };
    }
  }
];

function generateRandomQuiz() {
  const templateIdx = Math.floor(Math.random() * QUIZ_TEMPLATES.length);
  const t = QUIZ_TEMPLATES[templateIdx];

  if (t.type === 'w/w') {
    const solute = Math.floor(Math.random() * 25) + 5; // 5 - 30 g
    const solvent = [80, 100, 150, 200, 250][Math.floor(Math.random() * 5)];
    return t.template(solute, solvent);
  } else if (t.type === 'w/v') {
    const solute = Math.floor(Math.random() * 30) + 10; // 10 - 40 g
    const volume = [100, 200, 250, 400, 500][Math.floor(Math.random() * 5)];
    return t.template(solute, volume);
  } else if (t.type === 'v/v') {
    const solute = [20, 35, 50, 70, 75][Math.floor(Math.random() * 5)];
    const solution = [100, 250, 500][Math.floor(Math.random() * 3)];
    return t.template(solute, solution);
  } else {
    // prep
    const percent = [2, 5, 8, 10, 15, 20][Math.floor(Math.random() * 6)];
    const volume = [100, 200, 250, 500][Math.floor(Math.random() * 4)];
    return t.template(percent, volume);
  }
}
