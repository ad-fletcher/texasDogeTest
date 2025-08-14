interface InfoBoxesProps {
  showInfoBoxes: boolean;
  messagesLength: number;
}

export function InfoBoxes({ showInfoBoxes, messagesLength }: InfoBoxesProps) {
  if (!showInfoBoxes || messagesLength > 0) {
    return null;
  }

  return (
    <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 What You Can Ask For</h3>
        <p className="text-sm text-gray-600 mb-4">
          Explore Texas payment data broken down by different categories. Ask for charts, summaries, or download complete datasets.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Agency Breakdown */}
        <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🏛️</span>
            <h4 className="font-medium text-gray-800">Agency</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Payment data by government agencies and departments
          </p>
          <div className="text-xs text-gray-500">
            Example: "Show me top spending agencies" or "Health dept spending trends"
          </div>
        </div>

        {/* Spending Category */}
        <div className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">📊</span>
            <h4 className="font-medium text-gray-800">Spending Category</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            High-level spending categories and classifications
          </p>
          <div className="text-xs text-gray-500">
            Example: "Personnel vs operational costs" or "Category breakdown"
          </div>
        </div>

        {/* Comptroller Code */}
        <div className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🔍</span>
            <h4 className="font-medium text-gray-800">Comptroller Code</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Detailed spending categories with specific comptroller codes
          </p>
          <div className="text-xs text-gray-500">
            Example: "Show comptroller code 1234" or "Detailed category analysis"
          </div>
        </div>

        {/* Application Fund */}
        <div className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💰</span>
            <h4 className="font-medium text-gray-800">Application Fund</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Funding sources and budget allocations
          </p>
          <div className="text-xs text-gray-500">
            Example: "General revenue fund spending" or "Fund source analysis"
          </div>
        </div>

        {/* Payee */}
        <div className="bg-white rounded-lg border border-red-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🏢</span>
            <h4 className="font-medium text-gray-800">Payee</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Companies, vendors, and recipients of payments
          </p>
          <div className="text-xs text-gray-500">
            Example: "Top contractors" or "University of Texas payments"
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg border border-indigo-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">📥</span>
            <h4 className="font-medium text-gray-800">Data Export</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Download complete datasets as CSV files
          </p>
          <div className="text-xs text-gray-500">
            Example: "Download agency data as CSV" or "Export to Excel"
          </div>
        </div>
      </div>
      

    </div>
  );
}
