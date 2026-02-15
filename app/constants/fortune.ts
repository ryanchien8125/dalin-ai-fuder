
export interface FortuneStick {
  value: number
  label: string
}

export const getFortuneStickList = (): FortuneStick[] => {
  return Array.from({ length: 60 }, (_, i) => {
    const value = i + 1
    return {
      value,
      label: `第 ${value} 籤`, // Simple generic label
    }
  })
}
