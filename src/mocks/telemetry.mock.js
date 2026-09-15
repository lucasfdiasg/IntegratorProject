// src/mocks/telemetry.mock.js

export const generateRealisticData = () => {
  const data = [];
  let baseTemp = 20; // Começa em 20°C
  let baseHum = 75;  // Começa em 75%
  
  const now = new Date('2026-05-18T08:00:00Z'); // Data base exigida pelo prompt
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    // Simular ciclo diário (mais quente/seco de dia, mais frio/úmido de noite)
    const hour = time.getHours();
    const isDay = hour > 8 && hour < 18;
    
    baseTemp += isDay ? (Math.random() * 2 - 0.5) : (Math.random() * -2 + 0.5);
    baseHum += isDay ? (Math.random() * -3 + 0.5) : (Math.random() * 3 - 0.5);
    
    // Limites realistas
    baseTemp = Math.max(18, Math.min(28, baseTemp));
    baseHum = Math.max(40, Math.min(90, baseHum));

    data.push({
      id: 24 - i,
      timestamp: time.toISOString(),
      temperatura_ar: parseFloat(baseTemp.toFixed(1)),
      umidade_ar: parseFloat(baseHum.toFixed(1)),
      umidade_solo: parseFloat((baseHum - 10).toFixed(1)), // Solo acompanha um pouco o ar
      status: "ok"
    });
  }
  return data;
};

export const MOCK_SUCCESS = generateRealisticData();

export const MOCK_OFFLINE = MOCK_SUCCESS.map((item, index) => {
  // Simular queda do sensor nas últimas 3 horas
  if (index >= 21 && index <= 23) {
    return {
      ...item,
      temperatura_ar: null,
      umidade_ar: null,
      umidade_solo: null,
      status: "offline"
    };
  }
  return item;
});