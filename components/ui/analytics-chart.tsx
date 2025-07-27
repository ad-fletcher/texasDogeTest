'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  description: string;
  xKey: string;
  yKeys: string[];
  colors?: Record<string, string>;
  legend: boolean;
  businessInsights: string[];
  takeaway: string;
  isTimeSeries: boolean;
  trendAnalysis?: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    changePercent?: number;
    seasonality?: string;
  };
  dataQuality: {
    completeness: number;
    timeRange: string;
    sampleSize: string;
  };
}

interface AnalyticsChartProps {
  chartConfig: ChartConfig;
  data: any[];
}

export function AnalyticsChart({ chartConfig, data }: AnalyticsChartProps) {
  const { type, title, description, xKey, yKeys, colors, legend, businessInsights, takeaway } = chartConfig;

  // Generate default colors if not provided
  const getColor = (key: string, index: number) => {
    return colors?.[key] || `hsl(${index * 137.5}, 70%, 50%)`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number | string, name?: string) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;
    return [formatCurrency(numValue), name || 'Value'];
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey} 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={formatTooltipValue} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={getColor(key, index)} />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={formatTooltipValue} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={getColor(key, index)}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={formatTooltipValue} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                fill={getColor(key, index)}
                stroke={getColor(key, index)}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        const pieData = data.map((item, index) => ({
          ...item,
          fill: getColor(item[xKey], index)
        }));
        
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              dataKey={yKeys[0]}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatCurrency(Number(value))]} />
          </PieChart>
        );

      default:
        return <div className="text-red-500">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="w-full space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      {/* Chart Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Chart Visualization */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Business Insights */}
      {businessInsights && businessInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">📊 Key Insights:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {businessInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Trend Analysis */}
      {chartConfig.trendAnalysis && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-900 mb-1">📈 Trend Analysis:</h4>
          <p className="text-sm text-blue-800">
            Direction: <strong>{chartConfig.trendAnalysis.direction}</strong>
            {chartConfig.trendAnalysis.changePercent && (
              <span> ({chartConfig.trendAnalysis.changePercent.toFixed(1)}% change)</span>
            )}
            {chartConfig.trendAnalysis.seasonality && (
              <span> • {chartConfig.trendAnalysis.seasonality}</span>
            )}
          </p>
        </div>
      )}

      {/* Takeaway */}
      {takeaway && (
        <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
          <p className="text-sm text-green-800">
            <strong>💡 Takeaway:</strong> {takeaway}
          </p>
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="text-xs text-gray-500 border-t pt-2 mt-4">
        📋 Data: {chartConfig.dataQuality.sampleSize} records • {chartConfig.dataQuality.timeRange} • 
        {chartConfig.dataQuality.completeness}% complete
      </div>
    </div>
  );
} 