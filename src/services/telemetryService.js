// src/services/telemetryService.js
import { MOCK_SUCCESS, MOCK_OFFLINE } from '../mocks/telemetry.mock';

export const fetchTelemetryData = async (simulatedState = 'success') => {
  // Simula o tempo de resposta da internet (800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  switch (simulatedState) {
    case 'error':
      throw new Error('Falha ao conectar com API. Verifique sua conexão ou tente novamente mais tarde.');
    case 'empty':
      return [];
    case 'offline':
      return MOCK_OFFLINE;
    case 'success':
    default:
      return MOCK_SUCCESS;
  }
};