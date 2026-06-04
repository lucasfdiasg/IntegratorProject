// src/features/telemetry/mocks/telemetry.mock.js

export const generateRealisticData = () => {
  const data = [];
  let baseTemp       = 20;
  let baseTempSolo   = 18;
  let baseHum        = 75;
  let baseHumSolo    = 65;
  let basePH         = 6.4;

  const now = new Date('2026-05-18T08:00:00Z');

  for (let i = 24; i >= 0; i--) {
    const time   = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour   = time.getHours();
    const isDay  = hour > 6 && hour < 19;

    // Temperatura do ar e do solo
    baseTemp     += isDay ? (Math.random() * 2 - 0.5) : (Math.random() * -2 + 0.5);
    baseTempSolo += isDay ? (Math.random() * 1.5 - 0.4) : (Math.random() * -1.5 + 0.4);
    baseTemp     = Math.max(18, Math.min(32, baseTemp));
    baseTempSolo = Math.max(15, Math.min(28, baseTempSolo));

    // Umidade do ar e do solo
    baseHum     += isDay ? (Math.random() * -3 + 0.5) : (Math.random() * 3 - 0.5);
    baseHumSolo += isDay ? (Math.random() * -2 + 0.3) : (Math.random() * 2 - 0.3);
    baseHum     = Math.max(40, Math.min(90, baseHum));
    baseHumSolo = Math.max(30, Math.min(85, baseHumSolo));

    // PH varia levemente ao longo do dia
    basePH += (Math.random() * 0.1 - 0.05);
    basePH = Math.max(5.5, Math.min(7.2, basePH));

    // Luminosidade: cresce de manhã, cai à tarde, zero à noite
    const peakHour    = 13;
    const hoursFromPeak = Math.abs(hour - peakHour);
    const rawLux      = isDay
      ? Math.max(0, 130000 - hoursFromPeak * 18000 + (Math.random() * 10000 - 5000))
      : 0;
    const luminosidade = Math.round(Math.max(0, rawLux));

    // Bomba liga quando umidade do solo está baixa
    const status_bomba = baseHumSolo < 50;

    data.push({
      id:               24 - i,
      timestamp:        time.toISOString(),
      temperatura:      parseFloat(baseTemp.toFixed(1)),
      temperatura_solo: parseFloat(baseTempSolo.toFixed(1)),
      umidade:          parseFloat(baseHum.toFixed(1)),
      umidade_solo:     parseFloat(baseHumSolo.toFixed(1)),
      luminosidade,
      PH_solo:          parseFloat(basePH.toFixed(2)),
      status_bomba,
      status:           'ok',
    });
  }

  return data;
};

export const MOCK_SUCCESS = generateRealisticData();

export const MOCK_OFFLINE = MOCK_SUCCESS.map((item, index) => {
  if (index >= 21 && index <= 23) {
    return {
      ...item,
      temperatura:      null,
      temperatura_solo: null,
      umidade:          null,
      umidade_solo:     null,
      luminosidade:     null,
      PH_solo:          null,
      status_bomba:     false,
      status:           'offline',
    };
  }
  return item;
});