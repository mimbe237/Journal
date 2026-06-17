'use client';

import { useEffect, useState, useMemo } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: ChartData[];
  title: string;
  color?: 'emerald' | 'blue' | 'amber' | 'purple';
  height?: number;
  loading?: boolean;
  formatValue?: (value: number) => string;
}

const colorVariants = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

export function SimpleBarChart({
  data,
  title,
  color = 'emerald',
  height = 200,
  loading = false,
  formatValue = (v) => v.toString(),
}: SimpleBarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="flex items-end gap-2" style={{ height }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 rounded-t animate-pulse"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-6">{title}</h3>
      
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-slate-500 font-medium">
                {formatValue(item.value)}
              </div>
              <div
                className={`w-full ${colorVariants[color]} rounded-t transition-all duration-500 hover:opacity-80`}
                style={{ height: `${barHeight}%`, minHeight: item.value > 0 ? '8px' : '0' }}
              />
              <div className="text-[10px] text-slate-400 truncate max-w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SimpleLineChartProps {
  data: ChartData[];
  title: string;
  color?: 'emerald' | 'blue' | 'amber' | 'purple';
  height?: number;
  loading?: boolean;
  formatValue?: (value: number) => string;
}

export function SimpleLineChart({
  data,
  title,
  color = 'blue',
  height = 200,
  loading = false,
  formatValue = (v) => v.toString(),
}: SimpleLineChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  // Calculate SVG path for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (item.value / maxValue) * 100;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  const strokeColor = {
    emerald: '#10b981',
    blue: '#3b82f6',
    amber: '#f59e0b',
    purple: '#8b5cf6',
  }[color];

  const fillColor = {
    emerald: 'rgba(16, 185, 129, 0.1)',
    blue: 'rgba(59, 130, 246, 0.1)',
    amber: 'rgba(245, 158, 11, 0.1)',
    purple: 'rgba(139, 92, 246, 0.1)',
  }[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-6">{title}</h3>
      
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill={fillColor}
          />
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="white"
                stroke={strokeColor}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="hover:r-6 transition-all cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Labels */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-[10px] text-slate-400 truncate">
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Legend with total */}
      <div className="mt-4 flex justify-between items-center text-sm">
        <span className="text-slate-500">Total:</span>
        <span className="font-semibold text-slate-700">
          {formatValue(data.reduce((acc, d) => acc + d.value, 0))}
        </span>
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  loading?: boolean;
}

export function SimpleDonutChart({ data, title, loading = false }: DonutChartProps) {
  const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  // Calculate segments
  let currentAngle = 0;
  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  const polarToCartesian = (angle: number, radius: number) => {
    const radians = (angle - 90) * (Math.PI / 180);
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const start1 = polarToCartesian(startAngle, outerRadius);
    const end1 = polarToCartesian(endAngle, outerRadius);
    const start2 = polarToCartesian(endAngle, innerRadius);
    const end2 = polarToCartesian(startAngle, innerRadius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start1.x} ${start1.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
      `L ${start2.x} ${start2.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-6">{title}</h3>
      
      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArcPath(segment.startAngle, segment.endAngle, 45, 30)}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-700">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600 flex-1">{item.label}</span>
              <span className="text-xs font-semibold text-slate-700">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default {
  SimpleBarChart,
  SimpleLineChart,
  SimpleDonutChart,
};
