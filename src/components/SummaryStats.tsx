import { AgentStats } from '../types/agent';

interface SummaryStatsProps {
  stats: AgentStats;
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-6 py-4">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Total Agents</div>
        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-green-200 bg-green-50">
        <div className="text-sm text-green-700 mb-1 font-medium">🟢 Available</div>
        <div className="text-3xl font-bold text-green-600">{stats.available}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-red-200 bg-red-50">
        <div className="text-sm text-red-700 mb-1 font-medium">🔴 Busy</div>
        <div className="text-3xl font-bold text-red-600">{stats.busy}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-amber-200 bg-amber-50">
        <div className="text-sm text-amber-700 mb-1 font-medium">🟡 Break</div>
        <div className="text-3xl font-bold text-amber-600">{stats.onBreak}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 col-span-2 md:col-span-1">
        <div className="text-sm text-gray-600 mb-1">Total Calls Today</div>
        <div className="text-3xl font-bold text-blue-600">{stats.totalCalls}</div>
      </div>
    </section>
  );
}
