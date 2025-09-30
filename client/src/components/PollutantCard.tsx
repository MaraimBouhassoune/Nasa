import { Card } from './ui/card';
import { POLLUTANT_INFO } from '../lib/constants';
import type { PollutantData } from '../lib/types';

interface PollutantCardProps {
  type: string;
  data: PollutantData;
}

export function PollutantCard({ type, data }: PollutantCardProps) {
  const info = POLLUTANT_INFO[type as keyof typeof POLLUTANT_INFO];
  
  if (!info) return null;

  return (
    <Card className="p-3 bg-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: info.color }}
        />
        <div className="text-xs text-gray-400">{info.symbol}</div>
      </div>
      
      <div className="text-lg font-semibold text-white mb-1">
        {data.value.toFixed(1)}
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        {data.unit}
      </div>
      
      <div className="text-xs text-gray-500">
        {data.source.join(', ')}
      </div>
    </Card>
  );
}
