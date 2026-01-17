'use client';

import { useState, useMemo } from 'react';
import type { PricePoint } from '@/lib/mock-data';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface PriceChartProps {
  data: PricePoint[];
  symbol: string;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatDate(dateString: string, range: TimeRange): string {
  const date = new Date(dateString);
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PriceChart({ data, symbol }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const ranges: Record<TimeRange, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const daysAgo = ranges[timeRange];
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysAgo);

    return data.filter(point => new Date(point.timestamp) >= cutoff);
  }, [data, timeRange]);

  // Calculate chart dimensions and scaling
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { minPrice, maxPrice, priceRange, points, isPositive, priceChange, volumeMax } = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        points: '',
        isPositive: true,
        priceChange: 0,
        volumeMax: 0,
      };
    }

    const prices = filteredData.map(d => d.price);
    const volumes = filteredData.map(d => d.volume);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const vMax = Math.max(...volumes);

    // Calculate price change
    const firstPrice = filteredData[0].price;
    const lastPrice = filteredData[filteredData.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Generate SVG path points
    const pathPoints = filteredData.map((point, index) => {
      const x = padding.left + (index / (filteredData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((point.price - min) / range) * innerHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return {
      minPrice: min,
      maxPrice: max,
      priceRange: range,
      points: pathPoints,
      isPositive: change >= 0,
      priceChange: change,
      volumeMax: vMax,
    };
  }, [filteredData, innerWidth, innerHeight, padding.left, padding.top]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (filteredData.length === 0) return '';
    const firstX = padding.left;
    const lastX = padding.left + innerWidth;
    const bottomY = padding.top + innerHeight;
    return `${points} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [points, filteredData.length, padding.left, padding.top, innerWidth, innerHeight]);

  // Handle mouse move for hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x >= padding.left && x <= padding.left + innerWidth && filteredData.length > 0) {
      const index = Math.round(((x - padding.left) / innerWidth) * (filteredData.length - 1));
      const clampedIndex = Math.max(0, Math.min(index, filteredData.length - 1));
      setHoveredPoint(filteredData[clampedIndex]);
      setHoverX(padding.left + (clampedIndex / (filteredData.length - 1)) * innerWidth);
    } else {
      setHoveredPoint(null);
      setHoverX(null);
    }
  };

  const strokeColor = isPositive ? '#16a34a' : '#ef4444';
  const fillColor = isPositive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <div className="surface-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="heading-3 text-lg sm:text-xl">Price Chart</h3>
          {hoveredPoint ? (
            <p className="text-muted text-xs sm:text-sm">
              {formatDate(hoveredPoint.timestamp, timeRange)} - {formatPrice(hoveredPoint.price)}
            </p>
          ) : (
            <p className="text-muted text-xs sm:text-sm">
              <span className={isPositive ? 'text-green-600' : 'text-red-500'}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
              {' '}in {timeRange}
            </p>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-botanical-100 rounded-lg p-1 self-start sm:self-auto">
          {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors
                ${timeRange === range
                  ? 'bg-white text-botanical-700 shadow-sm'
                  : 'text-botanical-500 hover:text-botanical-700'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoverX(null);
          }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const price = minPrice + priceRange * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[10px]"
                >
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {filteredData.length > 0 && [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const index = Math.floor(ratio * (filteredData.length - 1));
            const x = padding.left + ratio * innerWidth;
            return (
              <text
                key={ratio}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                className="fill-gray-400 text-[10px]"
              >
                {formatDate(filteredData[index].timestamp, timeRange)}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill={fillColor} />

          {/* Line */}
          <path
            d={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover line */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={padding.top}
              x2={hoverX}
              y2={padding.top + innerHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Hover point */}
          {hoveredPoint && hoverX !== null && (
            <circle
              cx={hoverX}
              cy={padding.top + innerHeight - ((hoveredPoint.price - minPrice) / priceRange) * innerHeight}
              r="5"
              fill="white"
              stroke={strokeColor}
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Volume bars */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2">Volume</p>
        <div className="flex items-end h-12 gap-0.5">
          {filteredData.map((point, index) => (
            <div
              key={index}
              className="flex-1 bg-botanical-200 rounded-t"
              style={{
                height: `${(point.volume / volumeMax) * 100}%`,
                minHeight: '2px',
              }}
              title={`${formatDate(point.timestamp, timeRange)}: $${point.volume.toLocaleString()}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
