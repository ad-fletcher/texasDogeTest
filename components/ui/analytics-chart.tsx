'use client';

import { useState, useMemo } from 'react';
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
  Brush,
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
  alternativeCharts?: Array<{
    type: 'bar' | 'line' | 'area' | 'pie';
    reason: string;
    suitability: number;
    title: string;
    analyticalPerspective: string;
  }>;
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
  const { xKey, yKeys, colors, legend, businessInsights, takeaway } = chartConfig;
  const [zoomDomain, setZoomDomain] = useState<any>(null);
  const [hoveredElement, setHoveredElement] = useState<any>(null);
  
  // State for multiple chart type support
  const [currentChartType, setCurrentChartType] = useState(chartConfig.type);
  const [currentConfig, setCurrentConfig] = useState(chartConfig);

  // Calculate dynamic margins and spacing based on data
  const chartDimensions = useMemo(() => {
    const maxLabelLength = Math.max(...data.map(item => String(item[xKey]).length));
    const hasLongLabels = maxLabelLength > 15;
    const needsRotation = hasLongLabels || data.length > 8;
    
    // Calculate bottom margin based on label characteristics
    let bottomMargin = 5;
    if (needsRotation) {
      bottomMargin = Math.min(maxLabelLength * 4, 120); // Cap at 120px
    } else if (hasLongLabels) {
      bottomMargin = 60;
    }
    
    // Add extra margin for time series brush
    if (currentConfig.isTimeSeries) {
      bottomMargin += 60;
    }
    
    return {
      margin: { top: 20, right: 30, left: 60, bottom: bottomMargin },
      needsRotation,
      hasLongLabels,
      maxLabelLength
    };
  }, [data, xKey, currentConfig.isTimeSeries]);

  // Switch between chart types
  const switchChartType = (newType: 'bar' | 'line' | 'area' | 'pie') => {
    if (newType === chartConfig.type) {
      // Switching back to primary chart
      setCurrentConfig(chartConfig);
      setCurrentChartType(chartConfig.type);
    } else {
      // Switching to alternative chart
      const altChart = chartConfig.alternativeCharts?.find(alt => alt.type === newType);
      if (altChart) {
        setCurrentConfig({
          ...chartConfig,
          type: newType,
          title: altChart.title,
          description: `${chartConfig.description} - ${altChart.analyticalPerspective}`
        });
        setCurrentChartType(newType);
      }
    }
    // Reset zoom when switching chart types
    setZoomDomain(null);
  };

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

  // Truncate long labels for display
  const truncateLabel = (label: string, maxLength: number = 20) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  };

  // Get contextual insights based on data
  const getContextualInsight = (name: string, value: number) => {
    // Handle undefined, null, or non-string names
    if (!name || typeof name !== 'string') {
      return null;
    }
    
    const insights = [];
    
    // Agency-specific insights
    if (name.includes('Health')) {
      insights.push('Major social services provider');
    } else if (name.includes('Education') || name.includes('University')) {
      insights.push('Educational investment priority');
    } else if (name.includes('Transportation')) {
      insights.push('Infrastructure spending');
    } else if (name.includes('Military') || name.includes('Defense')) {
      insights.push('State security investment');
    }

    // Value-based insights (only if we don't have agency-specific insights)
    if (insights.length === 0) {
      if (value > 50000000) {
        insights.push('High-priority state function');
      } else if (value > 10000000) {
        insights.push('Significant budget allocation');
      } else if (value > 1000000) {
        insights.push('Moderate spending level');
      }
    }

    return insights.length > 0 ? insights[0] : null;
  };

  // Enhanced tooltip with contextual information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-200 max-w-xs z-50">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const insight = getContextualInsight(label, entry.value);
          return (
            <div key={index} className="space-y-1">
              <p className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
              </p>
              {insight && (
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  💡 {insight}
                </p>
              )}
            </div>
          );
        })}
        {currentConfig.isTimeSeries && (
          <div className="mt-2 text-xs text-gray-500">
            💡 Use brush below chart to zoom into specific time periods
          </div>
        )}
      </div>
    );
  };

  // Handle zoom for time series charts
  const handleZoom = (domain: any) => {
    setZoomDomain(domain);
  };

  // Custom label formatter for X-axis
  const formatXAxisLabel = (value: string) => {
    if (chartDimensions.needsRotation) {
      return truncateLabel(value, 25);
    }
    return truncateLabel(value, 15);
  };

  // Get suitability color based on score
  const getSuitabilityColor = (score: number) => {
    if (score >= 9) return 'text-green-700 bg-green-100';
    if (score >= 7) return 'text-blue-700 bg-blue-100';
    if (score >= 5) return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-700 bg-gray-100';
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: chartDimensions.margin,
    };

    switch (currentConfig.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey}
              angle={chartDimensions.needsRotation ? -45 : 0}
              textAnchor={chartDimensions.needsRotation ? "end" : "middle"}
              height={chartDimensions.margin.bottom}
              interval={0}
              domain={zoomDomain}
              tickFormatter={formatXAxisLabel}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              fontSize={12}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={getColor(key, index)}
                onMouseEnter={(data) => setHoveredElement(data)}
                onMouseLeave={() => setHoveredElement(null)}
                style={{ 
                  opacity: hoveredElement && hoveredElement[key] !== data.find(d => d[key] === hoveredElement[key])?.[key] ? 0.7 : 1
                }}
              />
            ))}
            {currentConfig.isTimeSeries && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={getColor(yKeys[0], 0)}
                onChange={handleZoom}
              />
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey}
              domain={zoomDomain}
              tickFormatter={formatXAxisLabel}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              fontSize={12}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {legend && <Legend />}
            {yKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={getColor(key, index)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
            {currentConfig.isTimeSeries && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={getColor(yKeys[0], 0)}
                onChange={handleZoom}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xKey}
              domain={zoomDomain}
              tickFormatter={formatXAxisLabel}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              fontSize={12}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
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
            {currentConfig.isTimeSeries && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={getColor(yKeys[0], 0)}
                onChange={handleZoom}
              />
            )}
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
              outerRadius={Math.min(120, (chartDimensions.margin.bottom - 60) / 2 + 80)}
              label={({ name, percent }) => `${truncateLabel(name, 15)}: ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
              fontSize={11}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  style={{ 
                    opacity: hoveredElement && hoveredElement !== entry ? 0.7 : 1
                  }}
                  onMouseEnter={() => setHoveredElement(entry)}
                  onMouseLeave={() => setHoveredElement(null)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return <div className="text-red-500">Unsupported chart type: {currentConfig.type}</div>;
    }
  };

  return (
    <div className="w-full space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      {/* Chart Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h3>
        <p className="text-sm text-gray-600">{currentConfig.description}</p>
      </div>

      {/* Chart Type Switcher */}
      {chartConfig.alternativeCharts && chartConfig.alternativeCharts.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">📊 View as different chart types:</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Primary Chart Type */}
            <button
              onClick={() => switchChartType(chartConfig.type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentChartType === chartConfig.type 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{chartConfig.type}</span>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                  Recommended
                </span>
              </div>
            </button>

            {/* Alternative Chart Types */}
            {chartConfig.alternativeCharts.map((alt, index) => (
              <button
                key={alt.type}
                onClick={() => switchChartType(alt.type)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentChartType === alt.type 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
                title={`${alt.reason} - ${alt.analyticalPerspective}`}
              >
                <span>{alt.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart Visualization with Dynamic Height */}
      <div className="w-full" style={{ height: `${400 + Math.max(0, chartDimensions.margin.bottom - 60)}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Zoom Reset Button for Time Series */}
      {currentConfig.isTimeSeries && zoomDomain && (
        <div className="flex justify-center">
          <button
            onClick={() => setZoomDomain(null)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            🔄 Reset Zoom
          </button>
        </div>
      )}

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