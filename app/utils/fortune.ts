
const HeavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EarthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const getLotGanZhi = (lotNumber: number): string => {
  if (lotNumber < 1 || lotNumber > 60) return ''
  
  // 1-based index calculation
  // 1 -> 甲子 (index 0, 0)
  const stemIndex = (lotNumber - 1) % 10
  const branchIndex = (lotNumber - 1) % 12
  
  const stem = HeavenlyStems[stemIndex]
  const branch = EarthlyBranches[branchIndex]

  if (!stem || !branch) return ''

  return stem + branch
}
