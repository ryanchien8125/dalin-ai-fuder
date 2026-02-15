import dayjs from 'dayjs'

// 將 datetime 與現在時間進行比較，回傳時間差。

export function formatTimeString(timeString) {
  // 若時間字串為空，則回傳空字串
  if (!timeString) return ''
  const time = dayjs(timeString)
  const now = dayjs()
  const { t } = useI18n()

  if (t) {
    if (now.diff(time, 'day') >= 3) {
      return time.format('YYYY-MM-DD')
    } else if (now.diff(time, 'day') >= 1) {
      return `${now.diff(time, 'day')} ${t('utils.global.formatTimeString.DaysAgo')}`
    } else if (now.diff(time, 'hour') >= 1) {
      return `${now.diff(time, 'hour')} ${t('utils.global.formatTimeString.HoursAgo')}`
    } else if (now.diff(time, 'minute') >= 1) {
      return `${now.diff(time, 'minute')} ${t('utils.global.formatTimeString.minutesAgo')}`
    } else {
      return t('utils.global.formatTimeString.justNow')
    }
  } else {
    if (now.diff(time, 'day') >= 3) {
      return time.format('YYYY-MM-DD')
    } else if (now.diff(time, 'day') >= 1) {
      return now.diff(time, 'day') + ' 天前'
    } else if (now.diff(time, 'hour') >= 1) {
      return now.diff(time, 'hour') + ' 小時前'
    } else if (now.diff(time, 'minute') >= 1) {
      return now.diff(time, 'minute') + ' 分鐘前'
    } else {
      return '剛剛'
    }
  }
}

export function formatFileSize(fileSize, fixed = 2) {
  try {
    const size = parseInt(fileSize, 10)
    if (isNaN(size)) return '--'

    if (size < 1024) {
      return size + ' B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(fixed) + ' KB'
    } else if (size < 1024 * 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(fixed) + ' MB'
    } else if (size < 1024 * 1024 * 1024 * 1024) {
      return (size / (1024 * 1024 * 1024)).toFixed(fixed) + ' GB'
    } else {
      return (size / (1024 * 1024 * 1024 * 1024)).toFixed(fixed) + ' TB'
    }
  } catch (e) {
    return '--'
  }
}

export function formatFileExtension(extension) {
  if (!extension) return ''
  return extension.toUpperCase()
}

export function formatFileShareType(shareType) {
  if (shareType === 'private') {
    return '私人'
  } else if (shareType === 'public') {
    return '公開'
  } else if (shareType === 'department') {
    return '部門'
  } else if (shareType === 'supervisor') {
    return '主管'
  } else if (shareType === 'specify') {
    return '指定對象'
  } else {
    return '未知'
  }
}

export function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  let result = []
  if (hrs > 0) result.push(`${hrs} 小時`)
  if (mins > 0) result.push(`${mins} 分`)
  if (secs > 0 || result.length === 0) result.push(`${secs} 秒`)

  return result.join(' ')
}
