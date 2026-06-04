const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const fetchWithTimeout = async (url, timeoutMs = 40000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('O servidor está demorando para responder. Ele pode estar acordando — aguarde alguns segundos e tente novamente.');
    }
    throw err;
  }
};

export const fetchCurrentTelemetry = async () => {
  const response = await fetchWithTimeout(`${BASE_URL}/telemetria/atual`);
  if (!response.ok) throw new Error('Erro ao buscar leitura em tempo real.');
  return response.json();
};

export const fetchTelemetryHistory = async () => {
  const response = await fetchWithTimeout(`${BASE_URL}/telemetria/historico`);
  if (!response.ok) throw new Error('Falha ao conectar com a API da Horta.');
  return response.json();
};