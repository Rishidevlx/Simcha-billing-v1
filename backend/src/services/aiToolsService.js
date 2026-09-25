import { getPool } from '../config/db.js'

/**
 * 100% Read-Only AI Tools Service
 * ONLY executes safe SELECT queries. Zero INSERT/UPDATE/DELETE.
 */

// 1. Tool: get_sales_analytics
export async function getSalesAnalytics({ period = 'today', startDate, endDate, customerName } = {}) {
  const pool = getPool()
  try {
    let dateCondition = '1=1'
    const params = []

    if (period === 'today') {
      dateCondition = 'DATE(created_at) = CURRENT_DATE()'
    } else if (period === 'yesterday') {
      dateCondition = 'DATE(created_at) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)'
    } else if (period === 'this_week') {
      dateCondition = 'YEARWEEK(created_at, 1) = YEARWEEK(CURRENT_DATE(), 1)'
    } else if (period === 'this_month') {
      dateCondition = 'MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    } else if (startDate && endDate) {
      dateCondition = 'DATE(created_at) BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }

    let customerCondition = '1=1'
    if (customerName && customerName.trim()) {
      customerCondition = 'customer_name LIKE ?'
      params.push(`%${customerName.trim()}%`)
    }

    // Overall Totals
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN UPPER(payment_status) = 'PAID' THEN total_amount ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN UPPER(payment_status) = 'PENDING' THEN total_amount ELSE 0 END), 0) as pending_revenue,
        COUNT(CASE WHEN UPPER(payment_status) = 'PAID' THEN 1 END) as paid_invoices_count,
        COUNT(CASE WHEN UPPER(payment_status) = 'PENDING' THEN 1 END) as pending_invoices_count,
        COALESCE(AVG(total_amount), 0) as average_bill_amount
      FROM bills
      WHERE ${dateCondition} AND ${customerCondition}
    `, params)

    // Payment Mode Breakdown
    const [paymentModeRows] = await pool.query(`
      SELECT 
        COALESCE(payment_mode, 'Unspecified') as payment_mode,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM bills
      WHERE ${dateCondition} AND ${customerCondition} AND UPPER(payment_status) = 'PAID'
      GROUP BY payment_mode
    `, params)

    return {
      success: true,
      period,
      customerName: customerName || null,
      summary: summaryRows[0] || {},
      payment_breakdown: paymentModeRows || []
    }
  } catch (err) {
    console.error('getSalesAnalytics tool error:', err)
    return { success: false, error: 'Failed to retrieve sales analytics.' }
  }
}

// 1b. Tool: get_customer_sales (Filter bills and sales for a specific customer)
export async function getCustomerSales({ customerName = '', customerPhone = '', period = 'all', limit = 10 } = {}) {
  const pool = getPool()
  try {
    if (!customerName && !customerPhone) {
      return { success: false, message: 'Please provide a customer name or phone number.' }
    }

    const conditions = []
    const params = []

    if (customerName && customerName.trim()) {
      conditions.push('(customer_name LIKE ? OR customer_name LIKE ?)')
      params.push(`%${customerName.trim()}%`, `${customerName.trim()}%`)
    }

    if (customerPhone && customerPhone.trim()) {
      conditions.push('customer_phone LIKE ?')
      params.push(`%${customerPhone.trim()}%`)
    }

    if (period === 'today') {
      conditions.push('DATE(created_at) = CURRENT_DATE()')
    } else if (period === 'yesterday') {
      conditions.push('DATE(created_at) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)')
    } else if (period === 'this_week') {
      conditions.push('YEARWEEK(created_at, 1) = YEARWEEK(CURRENT_DATE(), 1)')
    } else if (period === 'this_month') {
      conditions.push('MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())')
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'

    // Summary for customer
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN UPPER(payment_status) = 'PAID' THEN total_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN UPPER(payment_status) = 'PENDING' THEN total_amount ELSE 0 END), 0) as total_pending,
        COUNT(CASE WHEN UPPER(payment_status) = 'PAID' THEN 1 END) as paid_count,
        COUNT(CASE WHEN UPPER(payment_status) = 'PENDING' THEN 1 END) as pending_count
      FROM bills
      WHERE ${whereClause}
    `, params)

    // Detailed Invoices List
    const [invoiceRows] = await pool.query(`
      SELECT 
        b.id,
        b.invoice_number,
        COALESCE(b.receipt_number, 'N/A') as receipt_number,
        b.customer_name,
        COALESCE(b.customer_phone, 'N/A') as customer_phone,
        b.total_amount,
        b.payment_status,
        COALESCE(b.payment_mode, 'Not specified') as payment_mode,
        COALESCE(b.invoice_type, 'Tax Invoice') as invoice_type,
        DATE_FORMAT(b.created_at, '%d-%b-%Y') as invoice_date,
        (SELECT COUNT(*) FROM bill_items bi WHERE bi.bill_id = b.id) as items_count
      FROM bills b
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ?
    `, [...params, Number(limit) || 10])

    if (!invoiceRows || invoiceRows.length === 0) {
      return {
        success: true,
        matched: false,
        customerName,
        message: `No invoices found for customer matching "${customerName || customerPhone}".`,
        summary: { total_invoices: 0, total_spent: 0, total_paid: 0, total_pending: 0 },
        invoices: []
      }
    }

    return {
      success: true,
      matched: true,
      customerName: invoiceRows[0].customer_name,
      summary: summaryRows[0] || {},
      invoices: invoiceRows
    }
  } catch (err) {
    console.error('getCustomerSales tool error:', err)
    return { success: false, error: 'Failed to retrieve customer sales.' }
  }
}

// 2. Tool: check_stock_inventory
export async function checkStockInventory({ filter = 'low_stock', threshold = 10 } = {}) {
  const pool = getPool()
  try {
    let whereClause = '1=1'
    const params = []

    if (filter === 'low_stock') {
      whereClause = 'current_stock <= ?'
      params.push(Number(threshold) || 10)
    } else if (filter === 'out_of_stock') {
      whereClause = 'current_stock = 0'
    }

    const [rows] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        COALESCE(m.hsn_code, 'N/A') as hsn_code,
        m.current_stock,
        COALESCE(m.unit, 'Unit') as unit,
        m.selling_price,
        COALESCE(c.name, 'General') as category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE ${whereClause}
      ORDER BY m.current_stock ASC
      LIMIT 15
    `, params)

    const [countRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN current_stock <= 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count
      FROM materials
    `)

    return {
      success: true,
      filter,
      stats: countRows[0] || {},
      materials: rows
    }
  } catch (err) {
    console.error('checkStockInventory tool error:', err)
    return { success: false, error: 'Failed to retrieve stock inventory.' }
  }
}

// 3. Tool: get_pending_invoices
export async function getPendingInvoices({ customerName = '', limit = 10 } = {}) {
  const pool = getPool()
  try {
    let customerCondition = '1=1'
    const params = []

    if (customerName && customerName.trim()) {
      customerCondition = 'customer_name LIKE ?'
      params.push(`%${customerName.trim()}%`)
    }

    const [rows] = await pool.query(`
      SELECT 
        id,
        invoice_number,
        customer_name,
        COALESCE(customer_phone, 'N/A') as customer_phone,
        total_amount,
        payment_status,
        DATE_FORMAT(created_at, '%d-%b-%Y') as bill_date
      FROM bills
      WHERE UPPER(payment_status) = 'PENDING' AND ${customerCondition}
      ORDER BY created_at DESC
      LIMIT ?
    `, [...params, Number(limit) || 10])

    const [sumRow] = await pool.query(`
      SELECT 
        COUNT(*) as total_pending_count,
        COALESCE(SUM(total_amount), 0) as total_pending_amount
      FROM bills
      WHERE UPPER(payment_status) = 'PENDING' AND ${customerCondition}
    `, params)

    return {
      success: true,
      customerName: customerName || null,
      summary: sumRow[0] || {},
      pending_bills: rows
    }
  } catch (err) {
    console.error('getPendingInvoices tool error:', err)
    return { success: false, error: 'Failed to retrieve pending invoices.' }
  }
}

// 4. Tool: get_returns_analytics
export async function getReturnsAnalytics({ period = 'this_month', startDate, endDate, limit = 10 } = {}) {
  const pool = getPool()
  try {
    let dateCondition = '1=1'
    const params = []

    if (period === 'today') {
      dateCondition = 'DATE(return_date) = CURRENT_DATE()'
    } else if (period === 'yesterday') {
      dateCondition = 'DATE(return_date) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)'
    } else if (period === 'this_week') {
      dateCondition = 'YEARWEEK(return_date, 1) = YEARWEEK(CURRENT_DATE(), 1)'
    } else if (period === 'this_month') {
      dateCondition = 'MONTH(return_date) = MONTH(CURRENT_DATE()) AND YEAR(return_date) = YEAR(CURRENT_DATE())'
    } else if (startDate && endDate) {
      dateCondition = 'DATE(return_date) BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }

    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_returns_count,
        COALESCE(SUM(quantity), 0) as total_returned_qty,
        COALESCE(SUM(total_amount), 0) as total_return_amount,
        COALESCE(SUM(refund_amount), 0) as total_refund_amount
      FROM returns_registry
      WHERE ${dateCondition}
    `, params)

    const [recentRows] = await pool.query(`
      SELECT 
        return_number,
        bill_number,
        customer_name,
        item_name,
        quantity,
        total_amount,
        reason,
        qc_status,
        DATE_FORMAT(return_date, '%d-%b-%Y') as return_date
      FROM returns_registry
      WHERE ${dateCondition}
      ORDER BY return_date DESC
      LIMIT ?
    `, [...params, Number(limit) || 10])

    return {
      success: true,
      period,
      summary: summaryRows[0] || {},
      returns: recentRows
    }
  } catch (err) {
    console.error('getReturnsAnalytics tool error:', err)
    return { success: false, error: 'Failed to retrieve return records.' }
  }
}

// 4. Tool: search_products
export async function searchProducts({ query = '', limit = 5 } = {}) {
  const pool = getPool()
  try {
    if (!query) return { success: true, products: [] }
    const searchTerm = `%${query}%`

    const [rows] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        COALESCE(m.hsn_code, 'N/A') as hsn_code,
        m.current_stock,
        COALESCE(m.unit, 'Unit') as unit,
        m.selling_price,
        COALESCE(c.name, 'General') as category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.name LIKE ? OR m.hsn_code LIKE ?
      LIMIT ?
    `, [searchTerm, searchTerm, Number(limit) || 5])

    return {
      success: true,
      query,
      products: rows
    }
  } catch (err) {
    console.error('searchProducts tool error:', err)
    return { success: false, error: 'Failed to search products.' }
  }
}
