/**
 * ARQUIVO DE TESTES - src/__tests__/HistoryChart.test.jsx
 * * Este arquivo utiliza Jest e React Testing Library para validar
 * os 5 estados obrigatórios do componente de Histórico.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryChart from './HistoryChart';
import * as telemetryService from '../../services/telemetryService';

// Mock da biblioteca de gráficos (Chart.js) pois não precisamos renderizar o canvas no JSDOM
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />
}));

// Mock do serviço de fetch
jest.mock('../../services/telemetryService');

describe('HistoryChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Deve renderizar o estado de CARREGAMENTO (Loading)', () => {
    // Simulamos uma promise pendente para segurar o estado de loading
    telemetryService.fetchTelemetryData.mockReturnValue(new Promise(() => {}));
    
    render(<HistoryChart simulatedState="loading" />);
    
    expect(screen.getByText('Carregando dados da horta...')).toBeInTheDocument();
  });

  it('2. Deve renderizar o estado de SUCESSO com o gráfico', async () => {
    // Mock de sucesso com dados fictícios mínimos
    const mockData = [
      { id: 1, timestamp: '2026-05-18T10:00:00Z', temperatura_ar: 25, umidade_ar: 60, status: 'ok' }
    ];
    telemetryService.fetchTelemetryData.mockResolvedValue(mockData);

    render(<HistoryChart simulatedState="success" />);

    // Espera o carregamento sumir e o gráfico aparecer
    await waitFor(() => {
      expect(screen.queryByText('Carregando dados da horta...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Histórico de Temperatura e Umidade')).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('3. Deve renderizar o estado de ERRO caso a API falhe', async () => {
    // Simula uma rejeição na API
    telemetryService.fetchTelemetryData.mockRejectedValue(new Error('Falha de conexão simulada'));

    render(<HistoryChart simulatedState="error" />);

    await waitFor(() => {
      expect(screen.getByText('Falha na Sincronização')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Falha de conexão simulada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar Novamente/i })).toBeInTheDocument();
  });

  it('4. Deve renderizar o aviso de OFFLINE se houver falha recente no sensor', async () => {
    // Mock com dados indicando que o sensor caiu
    const mockDataOffline = [
      { id: 1, timestamp: '2026-05-18T10:00:00Z', temperatura_ar: 25, umidade_ar: 60, status: 'ok' },
      { id: 2, timestamp: '2026-05-18T11:00:00Z', temperatura_ar: null, umidade_ar: null, status: 'offline' }
    ];
    telemetryService.fetchTelemetryData.mockResolvedValue(mockDataOffline);

    render(<HistoryChart simulatedState="offline" />);

    await waitFor(() => {
      // Verifica se o banner de aviso offline apareceu
      expect(screen.getByText(/1 sensor offline/i)).toBeInTheDocument();
    });
    
    // O gráfico ainda deve ser renderizado para mostrar os dados anteriores
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('5. Deve renderizar o estado SEM DADOS (Empty) quando o array for vazio', async () => {
    // Simula API retornando array vazio
    telemetryService.fetchTelemetryData.mockResolvedValue([]);

    render(<HistoryChart simulatedState="empty" />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Não há registros de telemetria para as últimas 24 horas/i)).toBeInTheDocument();
    // O gráfico não deve ser renderizado
    expect(screen.queryByTestId('mock-line-chart')).not.toBeInTheDocument();
  });
});