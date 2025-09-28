const express = require('express');
const fs = require('fs').promises; // ✅ Hanya sekali
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Redirect root ke login.html
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Endpoint untuk daftar pengguna baharu
app.post('/save-user', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        // Validasi asas
        if (!name || !username || !password) {
            return res.status(400).json({ error: 'Semua medan diperlukan.' });
        }

        // Baca fail users.json sedia ada
        const usersPath = path.join(__dirname, 'public', 'users.json');
        let users = [];
        
        try {
            const data = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(data);
        } catch (readError) {
            console.log('users.json tidak wujud, cipta senarai baharu.');
        }

        // Tambah pengguna baharu
        const newUser = {
            id: Date.now().toString(),
            name,
            username,
            password
        };
        users.push(newUser);

        // Tulis semula ke fail
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        
        res.status(200).json({ message: 'Pengguna berjaya didaftarkan.' });
    } catch (error) {
        console.error('Ralat di /save-user:', error);
        res.status(500).json({ error: 'Gagal menyimpan pengguna.' });
    }
});

// Endpoint: Reset kata laluan pengguna
app.post('/reset-password', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'ID pengguna diperlukan.' });
        }

        const usersPath = path.join(__dirname, 'public', 'users.json');
        let users = [];

        // Baca data pengguna sedia ada
        try {
            const data = await fs.readFile(usersPath, 'utf8');
            users = JSON.parse(data);
            if (!Array.isArray(users)) throw new Error('Format users.json tidak sah.');
        } catch (readError) {
            console.error('Gagal membaca users.json:', readError);
            return res.status(500).json({ error: 'Gagal memuatkan data pengguna.' });
        }

        // Cari pengguna berdasarkan ID
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Pengguna tidak ditemui.' });
        }

        // Tetapkan semula kata laluan.
        // Anda boleh ubah logik ini. Contoh: gunakan ID sebagai kata laluan.
        const newPassword = id; // Atau "123456", atau sebarang nilai lalai yang anda mahu.
        users[userIndex].password = newPassword;

        // Simpan semula ke fail
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
        
        console.log(`✅ Kata laluan untuk pengguna ID ${id} telah ditetapkan semula.`);
        res.status(200).json({ 
            success: true, 
            message: `Kata laluan berjaya ditetapkan semula kepada: ${newPassword}` 
        });

    } catch (error) {
        console.error('Ralat di /reset-password:', error);
        res.status(500).json({ error: 'Gagal menetapkan semula kata laluan.' });
    }
});

// Endpoint untuk menyimpan senarai pengguna baharu (termasuk selepas padam)
app.post('/save-users', async (req, res) => {
    try {
        const users = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ error: 'Data mesti dalam bentuk tatasusunan' });
        }
        await fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(users, null, 2));
        res.json({ message: 'Berjaya menyimpan senarai pengguna' });
    } catch (err) {
        console.error('Ralat menulis users.json:', err);
        res.status(500).json({ error: 'Gagal menyimpan data' });
    }
});

// Endpoint: Simpan jadual waktu (DIPERBAIKI SEBENAR)
app.post('/save-jadual-waktu', async (req, res) => {
    try {
        const { nama_guru, jadual } = req.body;
        if (!nama_guru || !Array.isArray(jadual)) {
            return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
        }

        const filePath = path.join(__dirname, 'public', 'jadual_waktu.json');
        let allData = {};

        try {
            const data = await fs.readFile(filePath, 'utf8');
            allData = JSON.parse(data);
        } catch (err) {
            console.log('📁 Mencipta fail jadual_waktu.json baru...');
        }

        // ✅ GANTIKAN SEPENUHNYA — TIADA MERGE!
        allData[nama_guru] = jadual;

        await fs.writeFile(filePath, JSON.stringify(allData, null, 2), 'utf8');

        console.log(`✅ Jadual waktu untuk ${nama_guru} digantikan sepenuhnya.`);
        res.json({ success: true, message: 'Jadual waktu disimpan' });
    } catch (error) {
        console.error('❌ Ralat menyimpan jadual waktu:', error);
        res.status(500).json({ success: false, message: 'Ralat menyimpan jadual waktu' });
    }
});

// Endpoint: Simpan RPH draft (user biasa)
app.post('/save-rph-draft', async (req, res) => {
    try {
        const allData = req.body;
        const filePath = path.join(__dirname, 'public', 'rph_data.json');

        await fs.writeFile(filePath, JSON.stringify(allData, null, 2), 'utf8');

        console.log('✅ RPH draft disimpan');
        res.json({ success: true, message: 'RPH draft disimpan' });
    } catch (error) {
        console.error('❌ Ralat menyimpan RPH draft:', error);
        res.status(500).json({ success: false, message: 'Ralat menyimpan RPH draft' });
    }
});

// 🔸 Endpoint BARU: Simpan RPH untuk semakan admin
app.post('/submit-rph-for-review', async (req, res) => {
    try {
        const {
            guru,
            tarikh,
            kelas,
            matapelajaran,
            unit,
            skill,
            standards,
            objectives,
            assessment,
            teaching_aids,
            refleksi
        } = req.body;

        if (!guru || !tarikh || !kelas || !matapelajaran || !refleksi) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap. Pastikan refleksi diisi.'
            });
        }

        const filePath = path.join(__dirname, 'public', 'rph_admin.json');
        let adminData = [];

        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            adminData = JSON.parse(fileContent);
            if (!Array.isArray(adminData)) adminData = [];
        } catch (err) {
            console.log('📁 Fail rph_admin.json belum wujud. Akan dicipta baru.');
            adminData = [];
        }

        const existingIndex = adminData.findIndex(item =>
            item.guru === guru &&
            item.tarikh === tarikh &&
            item.kelas === kelas &&
            item.matapelajaran === matapelajaran
        );

        const newEntry = {
            guru,
            tarikh,
            kelas,
            matapelajaran,
            unit: unit || '',
            skill: skill || '',
            standards: standards || '',
            objectives: objectives || '',
            assessment: assessment || '',
            teaching_aids: teaching_aids || '',
            refleksi: refleksi || '',
            status: "Menunggu Semakan",
            comment: ""
        };

        if (existingIndex >= 0) {
            adminData[existingIndex] = newEntry;
            console.log(`🔄 RPH untuk ${guru} pada ${tarikh} (${kelas}, ${matapelajaran}) dikemaskini dalam rph_admin.json`);
        } else {
            adminData.push(newEntry);
            console.log(`✅ RPH untuk ${guru} pada ${tarikh} (${kelas}, ${matapelajaran}) disimpan ke rph_admin.json`);
        }

        await fs.writeFile(filePath, JSON.stringify(adminData, null, 2), 'utf8');
        res.json({ success: true, message: 'RPH berjaya dihantar untuk semakan admin.' });
    } catch (error) {
        console.error('❌ Ralat menyimpan ke rph_admin.json:', error);
        res.status(500).json({ success: false, message: 'Ralat sistem semasa hantar untuk semakan.' });
    }
});

// ========================
// ENDPOINT: Ambil Komen Mingguan (dengan parameter guru)
// ========================
app.get('/weekly-feedback', async (req, res) => {
    const { year, week, guru } = req.query;

    if (!year || !week || !guru) {
        return res.status(400).json({ error: 'Parameter year, week, dan guru diperlukan.' });
    }

    try {
        const feedbackPath = path.join(__dirname, 'public', 'rph_weekly_feedback.json');
        let feedbacks = [];

        if (require('fs').existsSync(feedbackPath)) {
            const data = await fs.readFile(feedbackPath, 'utf8');
            if (data.trim()) {
                feedbacks = JSON.parse(data);
            }
        }

        // Cari rekod berdasarkan year + week + guru
        const found = feedbacks.find(f => 
            f.year == Number(year) && 
            f.weekNumber == Number(week) && 
            f.guru === guru
        );

        if (found) {
            res.json(found);
        } else {
            // Pulangkan nilai lalai
            res.json({ 
                year: Number(year), 
                weekNumber: Number(week), 
                guru: guru,
                status: 'Menunggu Semakan', 
                comment: '' 
            });
        }
    } catch (error) {
        console.error('Error membaca komen mingguan:', error);
        res.status(500).json({ error: 'Gagal memuatkan komen mingguan.' });
    }
});

// ========================
// ENDPOINT: Simpan Komen Mingguan (DENGAN reviewedBy)
// ========================
app.post('/save-weekly-feedback', async (req, res) => {
    const { year, weekNumber, guru, comment, reviewedBy } = req.body;

    // ✅ Pengesahan: reviewedBy boleh string kosong, tapi mesti wujud
    if (!year || !weekNumber || !guru || reviewedBy === undefined) {
        return res.status(400).json({ 
            error: 'Field wajib tidak lengkap: year, weekNumber, guru, reviewedBy' 
        });
    }

    try {
        const feedbackPath = path.join(__dirname, 'public', 'rph_weekly_feedback.json');
        let feedbacks = [];

        if (require('fs').existsSync(feedbackPath)) {
            const data = await fs.readFile(feedbackPath, 'utf8');
            if (data.trim()) {
                feedbacks = JSON.parse(data);
            }
        }

        const yearNum = Number(year);
        const weekNum = Number(weekNumber);

        const existingIndex = feedbacks.findIndex(f => 
            f.year === yearNum && 
            f.weekNumber === weekNum && 
            f.guru === guru
        );

        const newFeedback = {
            year: yearNum,
            weekNumber: weekNum,
            guru: guru.trim(),
            comment: (comment || '').trim(),
            reviewedBy: (reviewedBy || '').trim() // ✅ Simpan reviewedBy
        };

        if (existingIndex >= 0) {
            feedbacks[existingIndex] = newFeedback;
        } else {
            feedbacks.push(newFeedback);
        }

        await fs.writeFile(feedbackPath, JSON.stringify(feedbacks, null, 2), 'utf8');
        res.json({ success: true, message: 'Maklum balas berjaya disimpan.' });

    } catch (error) {
        console.error('Error menyimpan komen mingguan:', error);
        res.status(500).json({ error: 'Gagal menyimpan komen mingguan.' });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});