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
            Example: &quot;Show me top spending agencies&quot; or &quot;Health dept spending trends&quot;
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
            Example: &quot;Personnel vs operational costs&quot; or &quot;Category breakdown&quot;
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
            Example: &quot;Show comptroller code 1234&quot; or &quot;Detailed category analysis&quot;
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
            Example: &quot;General revenue fund spending&quot; or &quot;Fund source analysis&quot;
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
            Example: &quot;Top contractors&quot; or &quot;University of Texas payments&quot;
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
            Example: &quot;Download agency data as CSV&quot; or &quot;Export to Excel&quot;
          </div>
        </div>
      </div>
      

    </div>
  );
}
