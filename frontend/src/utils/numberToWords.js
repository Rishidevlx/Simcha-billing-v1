// Convert numbers to Indian Rupees in Words (e.g. 2849 -> "Two Thousand Eight Hundred Forty Nine Rupees Only")
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
]

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
]

function numToWordsUnderThousand(num) {
  let str = ''
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred '
    num %= 100
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' '
    num %= 10
  }
  if (num > 0) {
    str += ones[num] + ' '
  }
  return str.trim()
}

export function numberToIndianRupees(amount) {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero Rupees Only'
  
  const num = Math.floor(Math.abs(amount))
  const paise = Math.round((Math.abs(amount) - num) * 100)

  let words = ''

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  if (crore > 0) {
    words += numToWordsUnderThousand(crore) + ' Crore '
  }
  if (lakh > 0) {
    words += numToWordsUnderThousand(lakh) + ' Lakh '
  }
  if (thousand > 0) {
    words += numToWordsUnderThousand(thousand) + ' Thousand '
  }
  if (remainder > 0) {
    words += numToWordsUnderThousand(remainder) + ' '
  }

  words = words.trim() + ' Rupees'

  if (paise > 0) {
    words += ' and ' + numToWordsUnderThousand(paise) + ' Paise'
  }

  return words.trim() + ' Only'
}
