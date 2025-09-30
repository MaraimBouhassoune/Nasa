import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from './ui/card';
import { getAQIColor } from '../lib/constants';
import type { ForecastPoint } from '../lib/types';

interface ForecastChartProps {
  forecast: ForecastPoint[];
  history: ForecastPoint[];
}

export function ForecastChart({ forecast, history }: ForecastChartProps) {
  // Combine history and forecast data
  const allData = [
    ...history.slice(-24).map(point => ({ 
      ...point, 
      time: new Date(point.t).getHours(),
      type: 'history' 
    })),
    ...forecast.map(point => ({ 
      ...point, 
      time: new Date(point.t).getHours(),
      type: 'forecast' 
    }))
  ];

  const now = new Date().getHours();

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={allData}>
            <XAxis 
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              domain={[0, 23]}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              domain={[0, 200]}
            />
            
            {/* Current time reference line */}
            <ReferenceLine 
              x={now} 
              stroke="#60A5FA" 
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            
            {/* History line */}
            <Line
              dataKey="aqi"
              stroke="#6B7280"
              strokeWidth={2}
              dot={false}
              data={allData.filter(d => d.type === 'history')}
            />
            
            {/* Forecast line */}
            <Line
              dataKey="aqi"
              stroke="#60A5FA"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              data={allData.filter(d => d.type === 'forecast')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
        <span>7d History</span>
        <span className="text-blue-400">24h Forecast</span>
      </div>
    </Card>
  );
}
