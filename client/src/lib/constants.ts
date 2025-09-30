export const AQI_CATEGORIES = {
  GOOD: { min: 0, max: 50, color: 'green', label: 'Good' },
  MODERATE: { min: 51, max: 100, color: 'yellow', label: 'Moderate' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, color: 'orange', label: 'Unhealthy for Sensitive Groups' },
  UNHEALTHY: { min: 151, max: 200, color: 'red', label: 'Unhealthy' },
  VERY_UNHEALTHY: { min: 201, max: 300, color: 'purple', label: 'Very Unhealthy' },
  HAZARDOUS: { min: 301, max: 500, color: 'maroon', label: 'Hazardous' },
};

export const POLLUTANT_INFO = {
  no2: { name: 'Nitrogen Dioxide', symbol: 'NO₂', color: '#ff6b6b' },
  o3: { name: 'Ozone', symbol: 'O₃', color: '#4ecdc4' },
  pm25: { name: 'Fine Particles', symbol: 'PM2.5', color: '#45b7d1' },
  hcho: { name: 'Formaldehyde', symbol: 'HCHO', color: '#96ceb4' },
};

export const HEALTH_PROFILES = {
  general: { icon: '👤', label: 'General Population' },
  children: { icon: '👶', label: 'Children' },
  asthma: { icon: '🫁', label: 'Asthma & Respiratory' },
  elderly: { icon: '👴', label: 'Elderly (65+)' },
  athletes: { icon: '🏃', label: 'Athletes & Active' },
};

export function getAQICategory(aqi: number) {
  for (const [key, category] of Object.entries(AQI_CATEGORIES)) {
    if (aqi >= category.min && aqi <= category.max) {
      return { ...category, key };
    }
  }
  return AQI_CATEGORIES.HAZARDOUS;
}

export function getAQIColor(aqi: number): string {
  const category = getAQICategory(aqi);
  const colorMap: Record<string, string> = {
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#8b5cf6',
    maroon: '#7f1d1d',
  };
  return colorMap[category.color] || colorMap.red;
}
