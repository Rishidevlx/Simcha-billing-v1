import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const dbConfig = {
  host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: parseInt(process.env.TIDB_PORT || '4000', 10),
  user: process.env.TIDB_USER || '4SdUDroc3aRrqF9.root',
  password: process.env.TIDB_PASSWORD || '45j40tZfeQb8C9xB',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
}

const dbName = process.env.TIDB_DATABASE || 'simcha_billing'

let pool = null
let initPromise = null

export async function initDatabase() {
  if (pool) return pool

  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('🔄 Connecting to TiDB Cloud Serverless...')
        
        // Step 1: Connect to server to ensure database exists
        const initConnection = await mysql.createConnection(dbConfig)
        await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`)
        await initConnection.end()
        console.log(`✅ Database "${dbName}" verified / created successfully.`)

        // Step 2: Initialize connection pool with the database
        pool = mysql.createPool({
          ...dbConfig,
          database: dbName,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000
        })

        // Step 3: Create Users table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(191) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'Administrator',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "users" table ready.')

        // Step 4: Seed default Admin user if not exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@simcha.com'])
        if (existing.length === 0) {
          const hashedPassword = await bcrypt.hash('admin123', 10)
          await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Rishi', 'admin@simcha.com', hashedPassword, 'Administrator']
          )
          console.log('✨ Seeded default Admin user: admin@simcha.com / admin123')
        }

        // Step 5: Create Categories table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            status ENUM('Active', 'Inactive') DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "categories" table ready.')

        // Step 6: Seed initial categories if empty
        const [catCount] = await pool.query('SELECT COUNT(*) as count FROM categories')
        if (catCount[0].count === 0) {
          await pool.query(`
            INSERT INTO categories (name, status) VALUES 
            ('Raw Materials', 'Active'),
            ('Textiles & Fabrics', 'Active'),
            ('Packaging Goods', 'Active'),
            ('Hardware & Tools', 'Inactive')
          `)
          console.log('✨ Seeded sample categories.')
        }

        // Step 7: Create Materials table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS materials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            code VARCHAR(100),
            category_id INT,
            brand VARCHAR(100),
            unit VARCHAR(50) DEFAULT 'Nos',
            description TEXT,
            selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            mrp DECIMAL(12, 2) DEFAULT 0.00,
            hsn_code VARCHAR(50),
            tax_inclusive BOOLEAN DEFAULT FALSE,
            opening_stock INT DEFAULT 0,
            reorder_level INT DEFAULT 0,
            barcode VARCHAR(100),
            warranty VARCHAR(100),
            serial_tracking BOOLEAN DEFAULT FALSE,
            status ENUM('Active', 'Inactive') DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "materials" table ready.')

        // Step 8: Seed initial materials if empty
        const [matCount] = await pool.query('SELECT COUNT(*) as count FROM materials')
        if (matCount[0].count === 0) {
          await pool.query(`
            INSERT INTO materials (name, code, category_id, brand, unit, description, selling_price, mrp, hsn_code, tax_inclusive, opening_stock, reorder_level, barcode, warranty, serial_tracking, status) VALUES 
            ('Logitech H390 USB Headphone', 'MAT-LOG-01', 1, 'Logitech', 'NOS', 'Comfortable USB Headset with noise-canceling mic', 2414.41, 2849.00, '851830', false, 50, 10, '8901234567890', '1 Year', true, 'Active'),
            ('Cotton Fabric Rolls 100m', 'MAT-CTN-01', 2, 'Simcha Textiles', 'Meter', '100% Pure Cotton fabric for apparel', 450.00, 520.00, '5208', true, 120, 20, '8901234567891', 'No Warranty', false, 'Active'),
            ('Heavy Duty Cardboard Box (Large)', 'MAT-PKG-02', 3, 'PackPro', 'Box', 'Corrugated heavy grade carton packaging', 85.00, 110.00, '4819', false, 500, 50, '8909876543210', 'No Warranty', false, 'Active'),
            ('Stainless Steel Screws 100pcs Pack', 'MAT-HDW-03', 4, 'Apex Hardware', 'Nos', 'Grade 304 anti-rust screws', 280.00, 350.00, '7318', true, 80, 15, '8904567891234', '6 Months', false, 'Active')
          `)
          console.log('✨ Seeded sample materials.')
        }

        // Step 9: Create Settings table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS settings (
            id INT PRIMARY KEY DEFAULT 1,
            company_name VARCHAR(200) NOT NULL DEFAULT 'SIMCHA INFO SOLUTIONS',
            address TEXT NOT NULL,
            phone VARCHAR(50) NOT NULL DEFAULT '8122022060',
            email VARCHAR(191) NOT NULL DEFAULT 'simchainfosolutions@gmail.com',
            gstin VARCHAR(50) NOT NULL DEFAULT '33GEZPM1178G1ZY',
            bank_name VARCHAR(100) DEFAULT 'Canara Bank',
            account_name VARCHAR(150) DEFAULT 'Simcha Info Solutions',
            account_no VARCHAR(100) DEFAULT '120041754011',
            ifsc_code VARCHAR(50) DEFAULT 'CNRB0002732',
            branch VARCHAR(100) DEFAULT 'Peelamedu',
            terms_conditions TEXT,
            cgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            sgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            igst_rate DECIMAL(5, 2) DEFAULT 18.00,
            invoice_prefix VARCHAR(20) DEFAULT 'INV-',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "settings" table ready.')

        // Step 10: Seed initial Settings if empty
        const [settingsCount] = await pool.query('SELECT COUNT(*) as count FROM settings')
        if (settingsCount[0].count === 0) {
          const defaultTerms = JSON.stringify([
            'Warranty as per manufacturer’s norms & should be claimed directly.',
            'Warranty claim takes 1 to 8 weeks.',
            'Please carry invoice copy for warranty.',
            'Goods Once Sold will not be taken back or exchanged.'
          ])
          await pool.query(`
            INSERT INTO settings (
              id, company_name, address, phone, email, gstin,
              bank_name, account_name, account_no, ifsc_code, branch,
              terms_conditions, cgst_rate, sgst_rate, igst_rate, invoice_prefix
            ) VALUES (
              1, 'SIMCHA INFO SOLUTIONS',
              '7A3, Thulasi Ammal Layout 2nd Street, Lakshmipuram, Peelamedu Post, Coimbatore - 641 004.',
              '8122022060', 'simchainfosolutions@gmail.com', '33GEZPM1178G1ZY',
              'Canara Bank', 'Simcha Info Solutions', '120041754011', 'CNRB0002732', 'Peelamedu',
              ?, 9.00, 9.00, 18.00, 'INV-'
            )
          `, [defaultTerms])
          console.log('✨ Seeded default system & company settings.')
        }

        // Step 11: Create Bills table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS bills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_number VARCHAR(100) UNIQUE NOT NULL,
            invoice_date DATE NOT NULL,
            invoice_type ENUM('NON_GST', 'GST') DEFAULT 'NON_GST',
            copy_type ENUM('ORIGINAL', 'DUPLICATE', 'TRIPLICATE') DEFAULT 'ORIGINAL',
            customer_name VARCHAR(200) NOT NULL,
            customer_phone VARCHAR(50),
            customer_email VARCHAR(191),
            customer_address TEXT,
            customer_gstin VARCHAR(50),
            place_of_supply VARCHAR(100) DEFAULT '33-Tamil Nadu',
            taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            cgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            cgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            sgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            sgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            igst_rate DECIMAL(5, 2) DEFAULT 18.00,
            igst_amount DECIMAL(12, 2) DEFAULT 0.00,
            total_tax DECIMAL(12, 2) DEFAULT 0.00,
            round_off DECIMAL(8, 2) DEFAULT 0.00,
            total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            amount_in_words TEXT,
            payment_mode ENUM('Cash', 'UPI', 'Bank Transfer', 'Card', 'Credit') DEFAULT 'Cash',
            payment_status ENUM('Paid', 'Partial', 'Pending') DEFAULT 'Paid',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        // Ensure settings table has new columns (bank_image_url, numbering schemes, signature_url)
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN bank_image_url TEXT NULL AFTER branch;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN signature_url TEXT NULL AFTER bank_image_url;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_financial_year VARCHAR(20) DEFAULT '2026-27';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_starting_number INT DEFAULT 1;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_padding_digits INT DEFAULT 4;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_separator VARCHAR(10) DEFAULT '/';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_prefix VARCHAR(20) DEFAULT 'SIS-REC';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_financial_year VARCHAR(20) DEFAULT '2026-27';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_starting_number INT DEFAULT 1;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_padding_digits INT DEFAULT 4;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_separator VARCHAR(10) DEFAULT '/';`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN return_days INT DEFAULT 7;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN service_prefix VARCHAR(50) DEFAULT 'SIS-SR';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN service_financial_year VARCHAR(20) DEFAULT '2026-27';`)
          await pool.query(`ALTER TABLE settings ADD COLUMN service_starting_number INT DEFAULT 1;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN service_padding_digits INT DEFAULT 4;`)
          await pool.query(`ALTER TABLE settings ADD COLUMN service_separator VARCHAR(10) DEFAULT '/';`)
        } catch {}

        // Ensure customer_email, customer_type, receipt_number, delivery_address, same_as_billing, due_date, has_due_date columns exist in bills
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN customer_email VARCHAR(191) NULL AFTER customer_phone;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN customer_type VARCHAR(50) DEFAULT 'Individual' AFTER customer_name;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN receipt_number VARCHAR(100) NULL AFTER invoice_number;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN delivery_address TEXT NULL AFTER customer_address;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN same_as_billing BOOLEAN DEFAULT TRUE AFTER delivery_address;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN due_date DATE NULL AFTER invoice_date;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN has_due_date BOOLEAN DEFAULT TRUE AFTER due_date;`)
        } catch {}

        // Ensure materials table has discount columns
        try {
          await pool.query(`ALTER TABLE materials ADD COLUMN has_discount BOOLEAN DEFAULT FALSE AFTER tax_inclusive;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE materials ADD COLUMN discount_percent DECIMAL(5, 2) DEFAULT 0.00 AFTER has_discount;`)
        } catch {}

        // Ensure bill_items table has discount columns
        try {
          await pool.query(`ALTER TABLE bill_items ADD COLUMN has_discount BOOLEAN DEFAULT FALSE AFTER rate;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bill_items ADD COLUMN discount_percent DECIMAL(5, 2) DEFAULT 0.00 AFTER has_discount;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bill_items ADD COLUMN discount_amount DECIMAL(12, 2) DEFAULT 0.00 AFTER discount_percent;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bill_items ADD COLUMN original_rate DECIMAL(12, 2) DEFAULT 0.00 AFTER discount_amount;`)
        } catch {}

        // Ensure settings table has due_date_days column
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN due_date_days INT DEFAULT 15 AFTER return_days;`)
        } catch {}

        // Ensure materials and bill_items have return_policy column
        try {
          await pool.query(`ALTER TABLE materials ADD COLUMN return_policy BOOLEAN DEFAULT FALSE AFTER serial_tracking;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE bill_items ADD COLUMN return_policy BOOLEAN DEFAULT FALSE AFTER tax_amount;`)
        } catch {}

        // Ensure payment_mode and payment_status support flexible strings and default to Pending
        try {
          await pool.query(`ALTER TABLE bills MODIFY COLUMN payment_mode VARCHAR(100) DEFAULT 'Cash';`)
          await pool.query(`ALTER TABLE bills MODIFY COLUMN payment_status VARCHAR(100) DEFAULT 'Pending';`)
        } catch (alterErr) {
          console.error('Error updating bills payment column definitions:', alterErr.message)
        }
        console.log('✅ "bills" table ready.')

        // Step 12: Create Bill Items table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS bill_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bill_id INT NOT NULL,
            material_id INT NULL,
            item_name VARCHAR(255) NOT NULL,
            serial_number VARCHAR(150),
            hsn_code VARCHAR(50),
            quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
            unit VARCHAR(50) DEFAULT 'NOS',
            rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            tax_rate DECIMAL(5, 2) DEFAULT 18.00,
            tax_amount DECIMAL(12, 2) DEFAULT 0.00,
            amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "bill_items" table ready.')

        // Step 12B: Create Inventory Serials table for serial number validation
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inventory_serials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            material_id INT NOT NULL,
            serial_number VARCHAR(150) NOT NULL UNIQUE,
            status ENUM('Available', 'Sold', 'Damaged') DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "inventory_serials" table ready.')

        // Seed sample serials for material 1 (Logitech) if table is empty
        const [serialCount] = await pool.query('SELECT COUNT(*) as count FROM inventory_serials')
        if (serialCount[0].count === 0) {
          const sampleSerials = [
            '2528ME12EZG9',
            '2528ME12EZ10',
            '2528ME12EZ11',
            'LOG-H390-1001',
            'LOG-H390-1002',
            'LOG-H390-1003',
            '8901234567890',
            '8901234567891',
            '8909876543210',
            '8904567891234'
          ]
          for (const sn of sampleSerials) {
            try {
              await pool.query(
                'INSERT IGNORE INTO inventory_serials (material_id, serial_number, status) VALUES (1, ?, "Available")',
                [sn]
              )
            } catch (e) {}
          }
          console.log('✨ Seeded initial inventory serial numbers.')
        }

        // Step 13: Seed sample initial bill if empty
        const [billCount] = await pool.query('SELECT COUNT(*) as count FROM bills')
        if (billCount[0].count === 0) {
          const [billRes] = await pool.query(`
            INSERT INTO bills (
              invoice_number, invoice_date, invoice_type, copy_type,
              customer_name, customer_phone, customer_address, place_of_supply,
              taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_amount,
              total_tax, round_off, total_amount, amount_in_words, payment_mode, payment_status
            ) VALUES (
              'INV-92026002', '2026-09-11', 'NON_GST', 'DUPLICATE',
              'Mrs. Sathya Shree', '8870551040', '11A, Sivakami Nagar, Ranganathapuram, Coimbatore - 641 402.', '33-Tamil Nadu',
              2414.41, 9.00, 217.30, 9.00, 217.30, 0.00,
              434.59, 0.00, 2849.00, 'Two Thousand Eight Hundred Forty Nine Rupees Only', 'Cash', 'Paid'
            )
          `)
          
          await pool.query(`
            INSERT INTO bill_items (
              bill_id, item_name, serial_number, hsn_code, quantity, unit, rate, tax_rate, tax_amount, amount
            ) VALUES (
              ?, 'Logitech H390 USB Headphone', '2528ME12EZG9', '851830', 1.00, 'NOS', 2414.41, 18.00, 434.59, 2849.00
            )
          `, [billRes.insertId])
          console.log('✨ Seeded sample initial invoice: INV-92026002 (Mrs. Sathya Shree)')
        }

        // Step 14: Create email_configs table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS email_configs (
            id INT PRIMARY KEY DEFAULT 1,
            smtp_host VARCHAR(150) DEFAULT 'smtp.gmail.com',
            smtp_port INT DEFAULT 465,
            smtp_secure BOOLEAN DEFAULT TRUE,
            smtp_user VARCHAR(191) DEFAULT 'simchainfosolutions@gmail.com',
            smtp_pass VARCHAR(255) DEFAULT '',
            sender_name VARCHAR(150) DEFAULT 'SIMCHA INFO SOLUTIONS',
            recipient_email VARCHAR(191) DEFAULT 'simchainfosolutions@gmail.com',
            auto_email_on_create BOOLEAN DEFAULT TRUE,
            email_customer_copy BOOLEAN DEFAULT TRUE,
            email_subject VARCHAR(255) DEFAULT 'New Tax Invoice Generated - {invoice_number}',
            email_body TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        // Ensure email_customer_copy column exists in existing databases
        try {
          await pool.query(`ALTER TABLE email_configs ADD COLUMN email_customer_copy BOOLEAN DEFAULT TRUE AFTER auto_email_on_create;`)
        } catch {
          // Column already exists
        }
        console.log('✅ "email_configs" table ready.')

        // Seed initial email config if empty
        const [emailConfigCount] = await pool.query('SELECT COUNT(*) as count FROM email_configs')
        if (emailConfigCount[0].count === 0) {
          await pool.query(`
            INSERT INTO email_configs (
              id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass,
              sender_name, recipient_email, auto_email_on_create, email_customer_copy, email_subject, email_body
            ) VALUES (
              1, 'smtp.gmail.com', 465, true, 'simchainfosolutions@gmail.com', '',
              'SIMCHA INFO SOLUTIONS', 'simchainfosolutions@gmail.com', true, true,
              'New Tax Invoice Generated - {invoice_number}',
              'Dear Customer / Team,\n\nPlease find attached the official Tax Invoice generated from Simcha Info Solutions Billing System.\n\nThank you for doing business with us!'
            )
          `)
          console.log('✨ Seeded default email configurations.')
        }

        // Step 15: Create Inward Bills table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inward_bills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inward_number VARCHAR(100) NOT NULL UNIQUE,
            inward_date DATE NOT NULL,
            supplier_name VARCHAR(255) NOT NULL,
            supplier_phone VARCHAR(50) NULL,
            supplier_email VARCHAR(191) NULL,
            supplier_location VARCHAR(100) DEFAULT '33 - Tamil Nadu',
            supplier_gstin VARCHAR(50) NULL,
            taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            cgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            cgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            sgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            sgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            igst_rate DECIMAL(5, 2) DEFAULT 18.00,
            igst_amount DECIMAL(12, 2) DEFAULT 0.00,
            total_tax DECIMAL(12, 2) DEFAULT 0.00,
            total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            total_quantity DECIMAL(10, 2) DEFAULT 0.00,
            total_items INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "inward_bills" table ready.')

        // Step 16: Create Inward Bill Items table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inward_bill_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inward_id INT NOT NULL,
            material_id INT NULL,
            item_name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            hsn_code VARCHAR(50) NULL,
            quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
            unit VARCHAR(50) DEFAULT 'NOS',
            rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            has_serial BOOLEAN DEFAULT FALSE,
            serial_numbers TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inward_id) REFERENCES inward_bills(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "inward_bill_items" table ready.')

        // Ensure hardcopy_url column exists in inward_bills
        try {
          await pool.query(`ALTER TABLE inward_bills ADD COLUMN hardcopy_url TEXT NULL AFTER total_items;`)
        } catch {}

        // Ensure bank_image_url column exists in settings
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN bank_image_url TEXT NULL AFTER branch;`)
        } catch {}

        // Ensure dynamic invoice numbering columns in settings
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_financial_year VARCHAR(20) DEFAULT '2026-27' AFTER invoice_prefix;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_starting_number INT DEFAULT 1 AFTER invoice_financial_year;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_padding_digits INT DEFAULT 4 AFTER invoice_starting_number;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN invoice_separator VARCHAR(10) DEFAULT '/' AFTER invoice_padding_digits;`)
        } catch {}

        // Ensure dynamic receipt numbering columns in settings
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_prefix VARCHAR(50) DEFAULT 'SIS-REC' AFTER invoice_separator;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_financial_year VARCHAR(20) DEFAULT '2026-27' AFTER receipt_prefix;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_starting_number INT DEFAULT 1 AFTER receipt_financial_year;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_padding_digits INT DEFAULT 4 AFTER receipt_starting_number;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE settings ADD COLUMN receipt_separator VARCHAR(10) DEFAULT '/' AFTER receipt_padding_digits;`)
        } catch {}

        // Ensure receipt_number column in bills
        try {
          await pool.query(`ALTER TABLE bills ADD COLUMN receipt_number VARCHAR(100) NULL AFTER invoice_number;`)
        } catch {}

        // Step 17: Create Cloudinary Configs table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS cloudinary_configs (
            id INT PRIMARY KEY DEFAULT 1,
            cloud_name VARCHAR(150) DEFAULT '',
            api_key VARCHAR(150) DEFAULT '',
            api_secret VARCHAR(255) DEFAULT '',
            folder_name VARCHAR(150) DEFAULT 'simcha_billing',
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        // Seed initial cloudinary config if empty
        const [cloudCount] = await pool.query('SELECT COUNT(*) as count FROM cloudinary_configs')
        if (cloudCount[0].count === 0) {
          await pool.query(`
            INSERT INTO cloudinary_configs (id, cloud_name, api_key, api_secret, folder_name, is_enabled)
            VALUES (1, '', '', '', 'simcha_billing', true)
          `)
          console.log('✨ Seeded default Cloudinary configurations.')
        }
        // Step 18: Ensure current_stock column exists in materials and create stock_ledger table
        try {
          await pool.query(`ALTER TABLE materials ADD COLUMN current_stock INT DEFAULT 0 AFTER opening_stock;`)
        } catch {}
        try {
          await pool.query(`UPDATE materials SET current_stock = opening_stock WHERE current_stock = 0 AND opening_stock > 0;`)
        } catch {}

        await pool.query(`
          CREATE TABLE IF NOT EXISTS stock_ledger (
            id INT AUTO_INCREMENT PRIMARY KEY,
            material_id INT NOT NULL,
            movement_type ENUM('INITIAL_STOCK', 'INWARD_PURCHASE', 'OUTWARD_SALE', 'MANUAL_ADJUSTMENT', 'DAMAGE_LOSS', 'RETURN', 'INWARD_REVERSAL', 'OUTWARD_REVERSAL') NOT NULL,
            reference_number VARCHAR(100) NULL,
            quantity_change DECIMAL(10, 2) NOT NULL,
            balance_stock DECIMAL(10, 2) NOT NULL,
            notes VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "stock_ledger" table ready.')

        // Step 19: Create inventory_serials table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inventory_serials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            material_id INT NOT NULL,
            serial_number VARCHAR(191) NOT NULL,
            status ENUM('Available', 'Sold', 'Damaged', 'Returned') NOT NULL DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_mat_serial (material_id, serial_number),
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "inventory_serials" table ready.')

        // Step 20: Create service_bills and service_bill_items tables
        await pool.query(`
          CREATE TABLE IF NOT EXISTS service_bills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_number VARCHAR(100) UNIQUE NOT NULL,
            receipt_number VARCHAR(100) NULL,
            service_date DATE NOT NULL,
            service_type ENUM('NON_GST', 'GST') DEFAULT 'NON_GST',
            copy_type ENUM('ORIGINAL', 'DUPLICATE', 'TRIPLICATE') DEFAULT 'ORIGINAL',
            customer_type VARCHAR(50) DEFAULT 'Individual',
            customer_name VARCHAR(200) NOT NULL,
            customer_phone VARCHAR(50),
            customer_email VARCHAR(191),
            customer_address TEXT,
            customer_gstin VARCHAR(50),
            place_of_supply VARCHAR(100) DEFAULT '33-Tamil Nadu',
            taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            cgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            cgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            sgst_rate DECIMAL(5, 2) DEFAULT 9.00,
            sgst_amount DECIMAL(12, 2) DEFAULT 0.00,
            igst_rate DECIMAL(5, 2) DEFAULT 18.00,
            igst_amount DECIMAL(12, 2) DEFAULT 0.00,
            total_tax DECIMAL(12, 2) DEFAULT 0.00,
            round_off DECIMAL(8, 2) DEFAULT 0.00,
            total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            amount_in_words TEXT,
            payment_mode VARCHAR(100) DEFAULT NULL,
            service_status ENUM('Received', 'Quotation', 'Customer Approval', 'Payment Received', 'Repair In-Progress', 'Ready', 'Delivered') DEFAULT 'Received',
            receipt_email_sent BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
        console.log('✅ "service_bills" table ready.')

        await pool.query(`
          CREATE TABLE IF NOT EXISTS service_bill_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_bill_id INT NOT NULL,
            material_id INT NULL,
            item_name VARCHAR(255) NOT NULL,
            product_name VARCHAR(255),
            brand_model VARCHAR(255),
            issue_description TEXT,
            serial_number VARCHAR(150),
            serial_numbers JSON,
            has_serial BOOLEAN DEFAULT FALSE,
            hsn_code VARCHAR(50),
            quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
            unit VARCHAR(50) DEFAULT 'NOS',
            rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            tax_rate DECIMAL(5, 2) DEFAULT 18.00,
            tax_amount DECIMAL(12, 2) DEFAULT 0.00,
            amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            return_policy BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (service_bill_id) REFERENCES service_bills(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        // Ensure service_bill_items has new columns
        try {
          await pool.query(`ALTER TABLE service_bill_items ADD COLUMN product_name VARCHAR(255) NULL AFTER item_name;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE service_bill_items ADD COLUMN brand_model VARCHAR(255) NULL AFTER product_name;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE service_bill_items ADD COLUMN issue_description TEXT NULL AFTER brand_model;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE service_bill_items ADD COLUMN serial_numbers JSON NULL AFTER serial_number;`)
        } catch {}
        try {
          await pool.query(`ALTER TABLE service_bill_items ADD COLUMN has_serial BOOLEAN DEFAULT FALSE AFTER serial_numbers;`)
        } catch {}

        console.log('✅ "service_bill_items" table ready.')

        return pool
      } catch (error) {
        initPromise = null // Allow retry on failure
        console.error('❌ Failed to initialize TiDB database:', error)
        throw error
      }
    })()
  }

  return initPromise
}

export function getPool() {
  if (!pool) {
    // Lazily create pool if called synchronously
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    })
  }
  return pool
}

