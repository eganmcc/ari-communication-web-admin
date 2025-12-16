import { Agent } from '../types/agent';
import { AgentCard } from './AgentCard';

interface AgentGridProps {
  agents: Map<string, Agent>;
}

export function AgentGrid({ agents }: AgentGridProps) {
  const agentList = Array.from(agents.values()).sort((a, b) => 
    a.extension.localeCompare(b.extension)
  );

  if (agentList.length === 0) {
    return (
      <div className="px-6 py-12">
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">No agents registered</div>
          <div className="text-gray-500 text-sm">
            Agents will appear here when they log in to the system
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agentList.map(agent => (
          <AgentCard key={agent.extension} agent={agent} />
        ))}
      </div>
    </section>
  );
}
