// db.js
// WP 2.4.1 filbert

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper untuk mendapatkan __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: "localhost",
    user: "root",
    password: "admin123", // Isi password DB Anda
    database: "EOSystem",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // PENTING: Harus true untuk menjalankan file SQL
};

// Buat pool
const pool = mysql.createPool(config);

// Fungsi untuk Inisialisasi Database
export const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        
        // Cek apakah tabel 'Asisten' sudah ada sebagai penanda
        const [rows] = await connection.query("SHOW TABLES LIKE 'Asisten'");

        if (rows.length === 0) {
            console.log("⚠️ Database kosong terdeteksi. Menjalankan initialize.sql...");
            
            // Baca file initialize.sql
            const sqlPath = path.join(__dirname, "initialize.sql");
            const sql = fs.readFileSync(sqlPath, "utf8");

            // Jalankan query dari file
            await connection.query(sql);
            console.log("✅ Database berhasil diinisialisasi dengan tabel dan data dummy!");
        } else {
            console.log("✅ Database sudah siap (Tabel ditemukan).");
        }

        connection.release();
    } catch (err) {
        console.error("❌ Gagal menginisialisasi database:", err.message);
        // Jika errornya karena database 'EOSystem' belum dibuat
        if (err.code === 'ER_BAD_DB_ERROR') {
             console.error("❗ Pastikan Anda sudah membuat database bernama 'EOSystem' di MySQL (phpMyAdmin/Workbench) sebelum menjalankan server.");
        }
    }
};

export const connect = () => {
    return pool; 
};

export default pool;