/**
 * Chemical Presets Database
 * Provides realistic colors, formulas, physical states, and descriptions
 * for science experiments in Thai secondary schools.
 */
const CHEMICAL_PRESETS = {
  cuso4: {
    id: 'cuso4',
    name: 'จุนสี (Copper(II) Sulfate)',
    formula: 'CuSO₄',
    state: 'solid',
    colorRgb: [30, 144, 255], // Dodger Blue
    colorHex: '#1e90ff',
    particleColor: '#60a5fa',
    particleShape: 'crystal',
    description: 'ผลึกสีฟ้าสดใส เมื่อละลายในน้ำจะได้สารละลายสีฟ้าใส นิยมใช้ในแล็บทดลองเรื่องการละลายและตกผลึก',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v'],
    maxSolubilityGper100mL: 32 // at 20°C
  },
  kmno4: {
    id: 'kmno4',
    name: 'ด่างทับทิม (Potassium Permanganate)',
    formula: 'KMnO₄',
    state: 'solid',
    colorRgb: [139, 0, 139], // Dark Magenta/Violet
    colorHex: '#8b008b',
    particleColor: '#c084fc',
    particleShape: 'dot',
    description: 'ผลึกสีม่วงเข้มเหลือบดำ เมื่อละลายแม้ปริมาณน้อยจะให้น้ำสีม่วงสดใสและเข้มจัดอย่างรวดเร็ว',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v'],
    maxSolubilityGper100mL: 6.4 // at 20°C
  },
  k2cr2o7: {
    id: 'k2cr2o7',
    name: 'โพแทสเซียมไดโครเมต (Potassium Dichromate)',
    formula: 'K₂Cr₂O₇',
    state: 'solid',
    colorRgb: [249, 115, 22], // Vivid Orange
    colorHex: '#f97316',
    particleColor: '#fdba74',
    particleShape: 'crystal',
    description: 'ผลึกสีส้มสด เมื่อละลายน้ำจะได้สารละลายสีส้มทอง เป็นตัวอย่างสารละลายมีสีที่ชัดเจนมาก',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v'],
    maxSolubilityGper100mL: 13
  },
  nacl: {
    id: 'nacl',
    name: 'เกลือแกง (Sodium Chloride)',
    formula: 'NaCl',
    state: 'solid',
    colorRgb: [203, 213, 225], // Light slate / almost clear
    colorHex: '#94a3b8',
    particleColor: '#ffffff',
    particleShape: 'cube',
    description: 'ผลึกสีขาว เมื่อละลายน้ำจะได้สารละลายใสไม่มีสี เช่น น้ำเกลือล้างแผล (0.9% w/v)',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v'],
    maxSolubilityGper100mL: 36 // at 20°C
  },
  sugar: {
    id: 'sugar',
    name: 'น้ำตาลทราย (Sucrose)',
    formula: 'C₁₂H₂₂O₁₁',
    state: 'solid',
    colorRgb: [245, 230, 190], // Subtle warm amber tint
    colorHex: '#fef08a',
    particleColor: '#fef9c3',
    particleShape: 'crystal',
    description: 'สารประกอบอินทรีย์ ละลายน้ำได้ดีมาก ให้สารละลายใสมีความหนืดเพิ่มขึ้นตามความเข้มข้น เช่น น้ำเชื่อม',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v'],
    maxSolubilityGper100mL: 200
  },
  ethanol: {
    id: 'ethanol',
    name: 'เอทานอล / แอลกอฮอล์ (Ethanol)',
    formula: 'C₂H₅OH',
    state: 'liquid',
    colorRgb: [56, 189, 248], // Sky Blue tint (like rubbing alcohol sanitizer)
    colorHex: '#38bdf8',
    particleColor: '#7dd3fc',
    particleShape: 'droplet',
    description: 'ของเหลวใสระเหยง่าย นิยมใช้เตรียมแอลกอฮอล์ล้างมือ 70% v/v ละลายเข้ากันได้ดีกับน้ำ',
    defaultUnit: 'mL',
    suitableTypes: ['v/v', 'w/w'],
    maxSolubilityGper100mL: 999 // Miscible
  },
  food_red: {
    id: 'food_red',
    name: 'น้ำหวาน / สีผสมอาหารสีแดง',
    formula: 'Food Dye (Red)',
    state: 'liquid',
    colorRgb: [239, 68, 68], // Red
    colorHex: '#ef4444',
    particleColor: '#fca5a5',
    particleShape: 'droplet',
    description: 'ของเหลวเข้มข้นสีแดงสด เช่น น้ำหวานเข้มข้นกลิ่นสละ ใช้เปรียบเทียบการเจือจางในชีวิตประจำวัน',
    defaultUnit: 'mL',
    suitableTypes: ['v/v', 'w/v'],
    maxSolubilityGper100mL: 999
  },
  food_green: {
    id: 'food_green',
    name: 'สีผสมอาหารสีเขียว / น้ำหวานกลิ่นครีมโซดา',
    formula: 'Food Dye (Green)',
    state: 'liquid',
    colorRgb: [16, 185, 129], // Emerald
    colorHex: '#10b981',
    particleColor: '#6ee7b7',
    particleShape: 'droplet',
    description: 'ของเหลวเข้มข้นสีเขียวสดใส มองเห็นการแพร่กระจายตัวของอนุภาคได้อย่างชัดเจน',
    defaultUnit: 'mL',
    suitableTypes: ['v/v', 'w/v'],
    maxSolubilityGper100mL: 999
  },
  custom: {
    id: 'custom',
    name: 'สารกำหนดเอง (Custom Chemical)',
    formula: 'Custom',
    state: 'solid',
    colorRgb: [168, 85, 247], // Default Purple
    colorHex: '#a855f7',
    particleColor: '#c084fc',
    particleShape: 'dot',
    description: 'กำหนดชื่อและเลือกสีของสารละลายที่ต้องการได้ตามใจชอบ',
    defaultUnit: 'g',
    suitableTypes: ['w/w', 'w/v', 'v/v'],
    maxSolubilityGper100mL: 100
  }
};
