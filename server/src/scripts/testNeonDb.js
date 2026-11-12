// Skrip Pengujian Langsung Koneksi dan Operasi Neon PostgreSQL
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function testNeon() {
  console.log('=== Menguji Koneksi dan Operasi Neon PostgreSQL ===');
  
  const testPhone = '08999999999';
  
  try {
    // 1. Bersihkan data pengujian lama jika ada
    await prisma.user.deleteMany({
      where: { phone: testPhone },
    });
    console.log('✅ Pembersihan data uji lama berhasil');

    // 2. Buat Pengguna Uji
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        phone: testPhone,
        password: hashedPassword,
        name: 'Mitra Uji Neon',
        occupation: 'Pengemudi Ojol',
      },
    });
    console.log(`✅ User berhasil dibuat di Neon DB: ID = ${user.id}, Nama = ${user.name}`);

    // 3. Buat Catatan Kerja (WorkLog)
    const log1 = await prisma.workLog.create({
      data: {
        userId: user.id,
        workHours: 9,
        income: 275000,
        symptoms: ['Punggung Bawah', 'Leher Kaku'],
      },
    });
    console.log(`✅ WorkLog berhasil disimpan ke Neon DB: ID = ${log1.id}, Jam Kerja = ${log1.workHours} jam, Pendapatan = Rp ${log1.income}`);

    // 4. Uji Quick Log (Duplikasi log terbaru)
    const latestLog = await prisma.workLog.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const quickLog = await prisma.workLog.create({
      data: {
        userId: user.id,
        workHours: latestLog.workHours,
        income: latestLog.income,
        symptoms: latestLog.symptoms,
      },
    });
    console.log(`✅ Quick Log berhasil digandakan di Neon DB: ID = ${quickLog.id}`);

    // 5. Uji Model AiInteraction
    const aiLog = await prisma.aiInteraction.create({
      data: {
        userId: user.id,
        pesanUser: 'Pinggang saya sakit setelah narik 9 jam',
        responsAi: {
          analisis: 'Gejala ketegangan otot lumbar akibat posisi duduk lama.',
          rencana_pemulihan: 'Istirahat 15 menit, lakukan peregangan cat-cow stretch.',
          saran_otc: 'Balsem hangat atau koyo pereda nyeri otot.',
          isEmergency: false,
        },
        isEmergency: false,
      },
    });
    console.log(`✅ AiInteraction berhasil disimpan di Neon DB: ID = ${aiLog.id}`);

    // 6. Query riwayat WorkLog
    const allLogs = await prisma.workLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Berhasil mengambil ${allLogs.length} catatan dari Neon DB`);

    // 7. Bersihkan data uji (Cascade delete ke WorkLog dan AiInteraction)
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('✅ Pembersihan cascade delete berhasil.');

    console.log('=== SEMUA OPERASI NEON POSTGRESQL 100% SUKSES! ===');
  } catch (error) {
    console.error('❌ Gagal dalam pengujian Neon DB:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNeon();
