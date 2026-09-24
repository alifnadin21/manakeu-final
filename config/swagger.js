const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '📘 Manakeu API Documentation',
            version: '1.0.0',
            description: `
**Manakeu** adalah platform web manajemen keuangan proyek yang menyediakan fitur pencatatan keuangan, pengelolaan proyek, pelaporan, integrasi WhatsApp, serta sistem autentikasi aman.

### 🎯 Fitur Utama
1. **💼 Manajemen Transaksi Kompleks**
   - Statistik, laporan bulanan, batch transaksi, persetujuan massal
   - Analisis nota, riwayat & aktivitas transaksi

2. **📦 Cache Optimization (Redis)**
   - Caching dashboard, ringkasan proyek, statistik, aktivitas, timeline, dsb.

3. **🕵️ Logging Aktivitas**
   - Pelacakan aktivitas pengguna lengkap dengan timestamp

4. **📲 Integrasi WhatsApp**
   - Kirim pesan, cek koneksi, validasi nomor & handling error

5. **🔐 Sistem Keamanan**
   - JWT Auth, Role-based Access Control (Admin/User), input validation

6. **🗃️ Manajemen Data**
   - CRUD semua entitas, soft-delete, transaksi DB, relasi antar entitas

7. **📊 Pelaporan Keuangan**
   - Ringkasan proyek, laporan keuangan, statistik, analisis, timeline

8. **🔔 Notifikasi & Revisi**
   - Notifikasi WhatsApp, counter notifikasi, status persetujuan & revisi

9. **📌 Manajemen Proyek**
   - Transfer ownership, anggaran, timeline, anggota proyek

10. **⚙️ Performa & Optimasi**
    - Redis cache, throttling, indexing, batch processing

11. **📘 Dokumentasi API**
    - Swagger lengkap, skema, request/response, error docs

12. **📄 Manajemen Nota**
    - Persetujuan, revisi, verifikasi, status & analisis nota

13. **💬 Integrasi Message (Twilio)** 
    - Kirim SMS, Buat Panggilan, Lihat Log Pesan

14. **💳 Integrasi Pembayaran (Midtrans)**
    - Memulai pembayaran, Mengecek status pembayaran, Menerima update status pembayaran

> Seluruh endpoint mendukung validasi input, error handling terstruktur, autentikasi dan otorisasi, serta pencatatan aktivitas.
      `,
            contact: {
                name: 'Manakeu Support',
                url: 'https://github.com/Firstianmaker/manakeu',
                email: 'derajat03@gmail.com'
            },
            license: {
                name: 'MIT License',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: '🚧 Local Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js', './app.js']
};

const specs = swaggerJsdoc(options);

module.exports = require('./apiContract')(specs);
