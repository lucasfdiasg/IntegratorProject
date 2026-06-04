import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HistoryChart from '../features/telemetry/components/HistoryChart.jsx';
import { fetchTelemetryHistory, fetchCurrentTelemetry } from '../features/telemetry/services/telemetryService.js';
import { MOCK_SUCCESS } from '../features/telemetry/mocks/telemetry.mock.js';

// Mock do serviço — nenhum teste deve bater na API real
jest.mock('../features/telemetry/services/telemetryService.js');

// jsdom não suporta canvas — mock do Chart.js e react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="line-chart" />,
}));
jest.mock('chart.js', () => ({
  Chart:         { register: jest.fn() },
  CategoryScale: class {},
  LinearScale:   class {},
  PointElement:  class {},
  LineElement:   class {},
  TimeScale:     class {},
  Title:         class {},
  Tooltip:       class {},
  Legend:        class {},
  Filler:        class {},
}));
jest.mock('chartjs-adapter-date-fns', () => ({}));

// jsdom não tem window.matchMedia — usado pelo componente para detectar dark mode
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

const MOCK_CURRENT = MOCK_SUCCESS[MOCK_SUCCESS.length - 1];

describe('HistoryChart', () => {
  beforeEach(() => jest.clearAllMocks());

  test('exibe loading ao iniciar', () => {
    fetchTelemetryHistory.mockResolvedValue(MOCK_SUCCESS);
    fetchCurrentTelemetry.mockResolvedValue(MOCK_CURRENT);

    render(<HistoryChart activeTab="tempo-real" />);

    expect(screen.getByText(/conectando à api da horta/i)).toBeInTheDocument();
  });

  test('exibe estado de erro quando a API falha', async () => {
    fetchTelemetryHistory.mockRejectedValue(new Error('Falha ao conectar'));
    fetchCurrentTelemetry.mockRejectedValue(new Error('Falha ao conectar'));

    render(<HistoryChart activeTab="tempo-real" />);

    await waitFor(() => {
      expect(screen.getByText(/falha na sincronização/i)).toBeInTheDocument();
    });
  });

  test('exibe estado vazio quando API retorna campo erro', async () => {
    fetchTelemetryHistory.mockResolvedValue({ erro: 'sem dados' });
    fetchCurrentTelemetry.mockResolvedValue({ erro: 'sem dados' });

    render(<HistoryChart activeTab="tempo-real" />);

    await waitFor(() => {
      expect(screen.getByText(/aguardando primeira leitura/i)).toBeInTheDocument();
    });
  });

  test('exibe o dashboard após resposta bem-sucedida da API', async () => {
    fetchTelemetryHistory.mockResolvedValue(MOCK_SUCCESS);
    fetchCurrentTelemetry.mockResolvedValue(MOCK_CURRENT);

    render(<HistoryChart activeTab="tempo-real" />);

    await waitFor(() => {
      expect(screen.getByText(/status do sistema de irrigação/i)).toBeInTheDocument();
    });
  });

  test('botão "Tentar Novamente" aciona nova requisição', async () => {
    fetchTelemetryHistory
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue(MOCK_SUCCESS);
    fetchCurrentTelemetry
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue(MOCK_CURRENT);

    render(<HistoryChart activeTab="tempo-real" />);

    await waitFor(() => {
      expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/tentar novamente/i));

    await waitFor(() => {
      expect(fetchTelemetryHistory).toHaveBeenCalledTimes(2);
    });
  });
});