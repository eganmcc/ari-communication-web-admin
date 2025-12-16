export function QueuePlaceholder() {
  return (
    <section className="px-6 py-4 mt-8">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📋 Queue Status</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Coming Soon - Phase 2
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Customers Waiting</div>
            <div className="text-2xl font-bold text-gray-400">--</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Longest Wait Time</div>
            <div className="text-2xl font-bold text-gray-400">--</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Average Wait Time</div>
            <div className="text-2xl font-bold text-gray-400">--</div>
          </div>
        </div>
      </div>
    </section>
  );
}
