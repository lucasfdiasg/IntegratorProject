// src/shared/utils/logger.test.js
import { metrics, logger } from './logger'; // Import ajustado para vizinhos!

// Bloco 1: Preparação e espionagem.

describe('Cenário C5: Observabilidade e Alarme de Taxa de Erro de Fetch', () => {
  let errorSpy;
  let infoSpy;

  beforeEach(() => {
    // "Espiona" as funções do logger sem impedir que elas executem
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Limpa os espiões após cada teste
    jest.restoreAllMocks();
  });

// Bloco 2: Provando que não há falsos positivos.

  it('deve provar que o sinal aparece sob falha, não alerta com sucesso e silencia ao recuperar', () => {
    // 1. CÓDIGO SAUDÁVEL: Um caso de sucessos consecutivos não emite o sinal
    for (let i = 0; i < 5; i++) {
      metrics.recordFetch(100, true); // 5 chamadas, 0 erros (0%)
    }
    expect(errorSpy).not.toHaveBeenCalled();

// Bloco 3: O incidente e a trava anti-spam.

    // 2. INCIDENTE: Forçando fetchWithTimeout a falhar repetidamente
    // Já temos 5 chamadas no histórico. Vamos adicionar 6 erros.
    // Total = 11 chamadas, 6 erros -> Taxa de 54.5% (cruza o limiar de 50%)
    for (let i = 0; i < 6; i++) {
      metrics.recordFetch(100, false);
    }
    
    // O sistema deve ter disparado o erro EXATAMENTE 1 vez (testando a trava _isAlertActive)
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      'metrics', 
      'error_rate_high', 
      expect.objectContaining({ errorRate: expect.any(Number) })
    );

// Bloco 4: Recuperação e silenciamento do alarme.

    // 3. RECUPERAÇÃO: A API volta e a taxa cai abaixo do limiar
    // Atualmente temos 11 chamadas e 6 erros (54%). 
    // Com mais 2 sucessos, vamos para 13 chamadas e 6 erros (6 / 13 = 46.1%).
    metrics.recordFetch(100, true); // 12 chamadas, 6 erros (50%) - Alarme ainda soando
    metrics.recordFetch(100, true); // 13 chamadas, 6 erros (46%) - Alarme silencia!

    // O sistema deve ter emitido o aviso de recuperação
    expect(infoSpy).toHaveBeenCalledWith(
      'metrics', 
      'error_rate_recovered', 
      expect.objectContaining({ errorRate: expect.any(Number) })
    );
  });
});