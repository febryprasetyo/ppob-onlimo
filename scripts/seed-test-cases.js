const knex = require('knex');
const config = {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5433,
    user: 'dbonlimo',
    password: 'oms001',
    database: 'ppob_db',
  },
};

const db = knex(config);

async function seedTestAssets() {
  try {
    console.log("Cleaning old test assets...");
    await db('assets_pln').where('nama_stasiun', 'like', 'TEST %').del();
    await db('assets_orbit').where('nama_stasiun', 'like', 'TEST %').del();

    console.log("Adding PLN Test Assets (Official Digiflazz Test Numbers)...");
    await db('assets_pln').insert([
      { nama_stasiun: 'TEST PLN SUCCESS', meter_number: '087800001230', operator_wa: '08123456789', customer_name: 'PELANGGAN SUKSES', segment_power: 'R1/900VA' },
      { nama_stasiun: 'TEST PLN PENDING', meter_number: '087800001233', operator_wa: '08123456789', customer_name: 'PELANGGAN PENDING', segment_power: 'R1/1300VA' },
      { nama_stasiun: 'TEST PLN FAILED', meter_number: '087800001232', operator_wa: '08123456789', customer_name: 'PELANGGAN GAGAL', segment_power: 'R1/450VA' },
    ]);

    console.log("Adding Orbit Test Assets (Official Digiflazz Test Numbers)...");
    await db('assets_orbit').insert([
      { nama_stasiun: 'TEST ORBIT SUCCESS', phone_number: '087800001230', operator_wa: '08123456789' },
      { nama_stasiun: 'TEST ORBIT PENDING', phone_number: '087800001233', operator_wa: '08123456789' },
      { nama_stasiun: 'TEST ORBIT FAILED', phone_number: '087800001232', operator_wa: '08123456789' },
    ]);

    console.log("Test assets seeded successfully with official numbers!");
  } catch (error) {
    console.error("Error seeding test assets:", error);
  } finally {
    process.exit();
  }
}

seedTestAssets();
