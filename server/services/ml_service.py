import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import asyncio

class MLService:
    """
    Machine Learning service for air quality forecasting
    Uses scikit-learn for simple regression models
    """
    
    def __init__(self):
        self.model = None
        self.is_trained = False
    
    async def predict_forecast(
        self, 
        lat: float, 
        lon: float, 
        historical_data: List[Dict], 
        weather_data: Dict,
        hours: int = 24
    ) -> List[Dict]:
        """
        Generate air quality forecast using ML regression
        """
        try:
            if len(historical_data) < 24:  # Need at least 24 hours of data
                return await self._simple_forecast(weather_data, hours)
            
            # Prepare features and train model
            features, targets = self._prepare_training_data(historical_data, weather_data)
            
            if len(features) < 10:  # Need minimum data for ML
                return await self._simple_forecast(weather_data, hours)
            
            # Train model
            model = self._train_model(features, targets)
            
            # Generate predictions
            forecast = []
            current_time = datetime.now()
            
            for h in range(1, hours + 1):
                future_time = current_time + timedelta(hours=h)
                
                # Create feature vector for prediction
                feature_vector = self._create_feature_vector(
                    historical_data, weather_data, h
                )
                
                # Predict AQI
                predicted_aqi = model.predict([feature_vector])[0]
                predicted_aqi = max(0, min(500, int(predicted_aqi)))  # Clamp to valid AQI range
                
                forecast.append({
                    "t": future_time.isoformat(),
                    "aqi": predicted_aqi
                })
            
            return forecast
            
        except Exception as e:
            print(f"ML forecast error: {e}")
            return await self._simple_forecast(weather_data, hours)
    
    def _prepare_training_data(self, historical_data: List[Dict], weather_data: Dict):
        """Prepare features and targets for ML training"""
        features = []
        targets = []
        
        # Sort historical data by time
        sorted_data = sorted(historical_data, key=lambda x: x["t"])
        
        # Create features for each time point (except the first few)
        for i in range(3, len(sorted_data)):
            # Features: previous AQI values, time factors, weather proxy
            feature_vector = [
                sorted_data[i-1]["aqi"],  # Previous AQI
                sorted_data[i-2]["aqi"],  # AQI 2 hours ago
                sorted_data[i-3]["aqi"],  # AQI 3 hours ago
                datetime.fromisoformat(sorted_data[i]["t"]).hour,  # Hour of day
                datetime.fromisoformat(sorted_data[i]["t"]).weekday(),  # Day of week
                weather_data.get("wind_speed_ms", 3.0),  # Wind speed
                weather_data.get("temp_c", 20.0),  # Temperature
                weather_data.get("humidity", 60),  # Humidity
                weather_data.get("precip_mm", 0.0),  # Precipitation
            ]
            
            features.append(feature_vector)
            targets.append(sorted_data[i]["aqi"])
        
        return np.array(features), np.array(targets)
    
    def _train_model(self, features: np.ndarray, targets: np.ndarray):
        """Train regression model on historical data"""
        try:
            # Use Random Forest for better handling of non-linear patterns
            model = RandomForestRegressor(
                n_estimators=50,
                max_depth=10,
                random_state=42,
                n_jobs=1  # Single threaded for faster training on small datasets
            )
            model.fit(features, targets)
            return model
        except:
            # Fallback to linear regression
            model = LinearRegression()
            model.fit(features, targets)
            return model
    
    def _create_feature_vector(self, historical_data: List[Dict], weather_data: Dict, hours_ahead: int):
        """Create feature vector for prediction"""
        # Get latest AQI values
        sorted_data = sorted(historical_data, key=lambda x: x["t"])[-3:]
        
        # Predict future time characteristics
        future_time = datetime.now() + timedelta(hours=hours_ahead)
        
        feature_vector = [
            sorted_data[-1]["aqi"] if len(sorted_data) >= 1 else 50,  # Latest AQI
            sorted_data[-2]["aqi"] if len(sorted_data) >= 2 else 50,  # Previous AQI
            sorted_data[-3]["aqi"] if len(sorted_data) >= 3 else 50,  # AQI 2 hours ago
            future_time.hour,  # Hour of day
            future_time.weekday(),  # Day of week
            weather_data.get("wind_speed_ms", 3.0),  # Current wind speed
            weather_data.get("temp_c", 20.0),  # Current temperature
            weather_data.get("humidity", 60),  # Current humidity
            weather_data.get("precip_mm", 0.0),  # Current precipitation
        ]
        
        return feature_vector
    
    async def _simple_forecast(self, weather_data: Dict, hours: int) -> List[Dict]:
        """Simple rule-based forecast when ML isn't available"""
        await asyncio.sleep(0.05)  # Simulate processing time
        
        # Base AQI estimate
        base_aqi = 65  # Moderate baseline
        
        # Weather effects on AQI
        wind_speed = weather_data.get("wind_speed_ms", 3.0)
        precipitation = weather_data.get("precip_mm", 0.0)
        temperature = weather_data.get("temp_c", 20.0)
        
        # Wind disperses pollution
        wind_effect = -min(20, wind_speed * 3)
        
        # Rain washes out particles
        rain_effect = -min(15, precipitation * 5)
        
        # High temperature can increase ozone formation
        temp_effect = max(0, (temperature - 25) * 0.5)
        
        forecast = []
        current_time = datetime.now()
        
        for h in range(1, hours + 1):
            future_time = current_time + timedelta(hours=h)
            
            # Daily pattern: higher pollution during rush hours
            hour = future_time.hour
            if hour in [7, 8, 17, 18, 19]:  # Rush hours
                time_effect = 15
            elif hour in [10, 11, 12, 13, 14, 15]:  # Midday
                time_effect = 5
            else:  # Night/early morning
                time_effect = -10
            
            # Add some random variation
            noise = np.random.normal(0, 5)
            
            predicted_aqi = base_aqi + wind_effect + rain_effect + temp_effect + time_effect + noise
            predicted_aqi = max(0, min(500, int(predicted_aqi)))
            
            forecast.append({
                "t": future_time.isoformat(),
                "aqi": predicted_aqi
            })
        
        return forecast
