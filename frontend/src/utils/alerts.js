import Swal from 'sweetalert2'

/**
 * Simcha Brand Theme Colors for SweetAlert
 */
const BRAND_PRIMARY = '#043486'
const BRAND_DANGER = '#d33'
const BRAND_CANCEL = '#64748b'

/**
 * Standard Toast Mixin configuration
 */
const ToastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

/**
 * 1. Global Toast Helper
 * Usage:
 *   showToast.success('Item added successfully!')
 *   showToast.error('Out of stock!')
 *   showToast.warning('Duplicate serial entered!')
 *   showToast.info('Item removed')
 */
export const showToast = {
  success: (title, text = '', options = {}) => {
    return ToastMixin.fire({
      icon: 'success',
      title,
      text: text || undefined,
      ...options
    })
  },
  error: (title, text = '', options = {}) => {
    return ToastMixin.fire({
      icon: 'error',
      title,
      text: text || undefined,
      timer: options.timer || 3500,
      ...options
    })
  },
  warning: (title, text = '', options = {}) => {
    return ToastMixin.fire({
      icon: 'warning',
      title,
      text: text || undefined,
      timer: options.timer || 3000,
      ...options
    })
  },
  info: (title, text = '', options = {}) => {
    return ToastMixin.fire({
      icon: 'info',
      title,
      text: text || undefined,
      ...options
    })
  }
}

/**
 * 2. Global Modal Alert Helper
 * Usage:
 *   showAlert.success('Invoice Created', 'Invoice #INV-01 saved.')
 *   showAlert.error('Validation Error', 'Please select customer.')
 */
export const showAlert = {
  success: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'success',
      title,
      text: text || undefined,
      confirmButtonColor: BRAND_PRIMARY,
      ...options
    })
  },
  error: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'error',
      title,
      text: text || undefined,
      confirmButtonColor: BRAND_PRIMARY,
      ...options
    })
  },
  warning: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text: text || undefined,
      confirmButtonColor: BRAND_PRIMARY,
      ...options
    })
  },
  info: (title, text = '', options = {}) => {
    return Swal.fire({
      icon: 'info',
      title,
      text: text || undefined,
      confirmButtonColor: BRAND_PRIMARY,
      ...options
    })
  }
}

/**
 * 3. Confirmation Dialog Helper
 * Usage:
 *   const confirmed = await showConfirm({
 *     title: 'Save Invoice?',
 *     text: 'Are you sure you want to save?'
 *   })
 *   if (confirmed) { ... }
 */
export const showConfirm = async ({
  title = 'Are you sure?',
  text = '',
  icon = 'warning',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  confirmColor = BRAND_PRIMARY,
  cancelColor = BRAND_CANCEL,
  reverseButtons = true,
  ...rest
} = {}) => {
  const result = await Swal.fire({
    title,
    text: text || undefined,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    cancelButtonColor: cancelColor,
    reverseButtons,
    ...rest
  })
  return Boolean(result.isConfirmed)
}

/**
 * 4. Specialized Delete Confirmation Helper
 * Usage:
 *   const isConfirmed = await showDeleteConfirm({
 *     itemName: 'Invoice #INV-2026-01',
 *     title: 'Delete Invoice?'
 *   })
 */
export const showDeleteConfirm = async ({
  title = 'Delete Item?',
  text = 'This action cannot be undone.',
  itemName = '',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  ...rest
} = {}) => {
  const result = await Swal.fire({
    title,
    html: itemName ? `Are you sure you want to delete <strong>"${itemName}"</strong>?<br/><span class="text-xs text-gray-500">${text}</span>` : text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: BRAND_DANGER,
    cancelButtonColor: BRAND_CANCEL,
    reverseButtons: true,
    ...rest
  })
  return Boolean(result.isConfirmed)
}

// Default export is the raw Swal instance with bound helpers
export default Swal
