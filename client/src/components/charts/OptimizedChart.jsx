// client/src/components/charts/OptimizedChart.jsx

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const OptimizedChart = ({ type, data, config }) => {
  // Memoize data transformation to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    // Apply any data transformations here
    return data;
  }, [data]);

  // Memoize chart color generation
  const colors = useMemo(() => {
    return (
      config.colors || ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]
    );
  }, [config.colors]);

  // Render different chart types based on the type prop
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart
            data={processedData}
            margin={config.margin || { top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis.dataKey} />
            {config.yAxis.map((axis, index) => (
              <YAxis
                key={index}
                yAxisId={axis.id}
                orientation={axis.orientation}
                stroke={axis.color}
                domain={axis.domain}
                tickFormatter={axis.tickFormatter}
              />
            ))}
            <Tooltip formatter={config.tooltipFormatter} />
            <Legend />
            {config.lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color || colors[index % colors.length]}
                yAxisId={line.yAxisId}
                name={line.name}
                activeDot={line.activeDot}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart
            data={processedData}
            margin={config.margin || { top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis.dataKey} />
            {config.yAxis.map((axis, index) => (
              <YAxis
                key={index}
                yAxisId={axis.id}
                orientation={axis.orientation}
                stroke={axis.color}
                domain={axis.domain}
                tickFormatter={axis.tickFormatter}
              />
            ))}
            <Tooltip formatter={config.tooltipFormatter} />
            <Legend />
            {config.bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.color || colors[index % colors.length]}
                yAxisId={bar.yAxisId}
                name={bar.name}
                stackId={bar.stackId}
              />
            ))}
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={processedData}
              cx={config.cx || "50%"}
              cy={config.cy || "50%"}
              labelLine={config.labelLine}
              outerRadius={config.outerRadius || 80}
              fill={config.fill || "#8884d8"}
              dataKey={config.dataKey}
              nameKey={config.nameKey}
              label={config.label}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={config.tooltipFormatter} />
            <Legend />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div style={{ width: "100%", height: config.height || 300 }}>
      <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
    </div>
  );
};

export default React.memo(OptimizedChart);
