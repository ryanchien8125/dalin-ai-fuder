export const getTimezoneOffsetString = (date = new Date()) => {
  const offsetMinutes = -(date.getTimezoneOffset()) // 注意：反轉符號
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0')
  return `${sign}${hours}:${minutes}`
}
