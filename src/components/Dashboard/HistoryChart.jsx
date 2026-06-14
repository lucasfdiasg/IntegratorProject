import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Loader2, AlertCircle, Info, WifiOff, Droplets, History, Activity, LayoutDashboard, Settings, Thermometer } from 'lucide-react';
import { fetchTelemetryData } from '../../services/telemetryService.js';

// Registrando componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
const HistoryChart = ({ simulatedState = 'success' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineInfo, setOfflineInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setOfflineInfo(null);
      
      try {
        const result = await fetchTelemetryData(simulatedState);
        
        if (isMounted) {
          setData(result);
          
          const offlinePoints = result.filter(r => r.status === 'offline');
          if (offlinePoints.length > 0) {
            const firstOffline = offlinePoints[0];
            const timeStr = new Date(firstOffline.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setOfflineInfo(`1 sensor offline (última leitura: ${timeStr})`);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => { isMounted = false; };
  }, [simulatedState]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando dados da horta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] bg-red-50 rounded-xl shadow-sm border border-red-200 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Falha na Sincronização</h3>
        <p className="text-red-600 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-slate-50 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <Info className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum dado disponível</h3>
        <p className="text-slate-500 max-w-md">Não há registros de telemetria para as últimas 24 horas. Verifique se os sensores estão ativados.</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: data.map(d => d.temperatura_ar),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: data.map(d => d.status === 'offline' ? 0 : 3),
        pointBackgroundColor: '#ef4444',
        spanGaps: true,
        yAxisID: 'y',
      },
      {
        label: 'Umidade do Ar (%)',
        data: data.map(d => d.umidade_ar),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: data.map(d => d.status === 'offline' ? 0 : 3),
        pointBackgroundColor: '#3b82f6',
        spanGaps: true,
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        callbacks: {
          label: function(context) {
            if (context.raw === null) return `${context.dataset.label}: SENSOR OFFLINE`;
            return `${context.dataset.label}: ${context.raw}${context.datasetIndex === 0 ? '°C' : '%'}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: { type: 'linear', display: true, position: 'left', min: 15, max: 35 },
      y1: { type: 'linear', display: true, position: 'right', min: 30, max: 100, grid: { drawOnChartArea: false } }
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {offlineInfo && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center gap-3 text-amber-800">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{offlineInfo}</span>
        </div>
      )}
      
      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Histórico de Temperatura e Umidade</h2>
            <p className="text-sm text-slate-500">Últimas 24 horas</p>
          </div>
        </div>
        
        <div className="relative w-full h-[300px] md:h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. APLICAÇÃO PRINCIPAL (Wrapper para Pré-visualização)
// ==========================================
function App() {
  const [testState, setTestState] = useState('success');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-emerald-900 text-emerald-50 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-emerald-800">
          <div className="flex items-center gap-3 font-bold text-xl">
            <Droplets className="text-emerald-400" />
            HortaSmart
          </div>
        </div>
        <nav className="flex-1 py-4">
          <a href="#" className="flex items-center gap-3 px-6 py-3 bg-emerald-800/50 border-r-4 border-emerald-400 text-white font-medium">
            <History className="w-5 h-5" /> Histórico (Ativo)
          </a>
          <a href="#" className="flex items-center gap-3 px-6 py-3 text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors opacity-50 cursor-not-allowed">
            <Activity className="w-5 h-5" /> Tempo Real
          </a>
          <a href="#" className="flex items-center gap-3 px-6 py-3 text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors opacity-50 cursor-not-allowed">
            <LayoutDashboard className="w-5 h-5" /> Controle Manual
          </a>
          <a href="#" className="flex items-center gap-3 px-6 py-3 text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors opacity-50 cursor-not-allowed">
            <Settings className="w-5 h-5" /> Configurações
          </a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col w-full max-w-full overflow-hidden">
        <div className="bg-indigo-600 text-white p-3 text-sm flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-indigo-800 px-2 py-1 rounded text-xs uppercase tracking-wider">Dev Control</span>
            Selecione o estado para teste:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'success', label: 'Sucesso' },
              { id: 'loading', label: 'Carregamento' },
              { id: 'error', label: 'Erro API' },
              { id: 'offline', label: 'Sensor Offline' },
              { id: 'empty', label: 'Sem Dados' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setTestState(s.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  testState === s.id 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'bg-indigo-500 hover:bg-indigo-400 text-indigo-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <header className="md:hidden bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Droplets className="w-5 h-5 text-emerald-400" />
            HortaSmart
          </div>
          <button className="p-2 bg-emerald-800 rounded">
            <History className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Análise de Dados</h1>
              <p className="text-slate-500 mt-1">Visualize o comportamento climático da horta.</p>
            </header>

            <HistoryChart simulatedState={testState} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <Thermometer className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Média de Temperatura (24h)</p>
                    <p className="text-2xl font-bold text-slate-800">23.4°C</p>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Média de Umidade (24h)</p>
                    <p className="text-2xl font-bold text-slate-800">65.2%</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HistoryChart;