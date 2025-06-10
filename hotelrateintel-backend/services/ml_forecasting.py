import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os
from dataclasses import dataclass
from sqlalchemy.orm import Session

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logging.warning("Prophet not available. Time series forecasting will be limited.")

from ..app import SessionLocal, RateData, Hotel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ForecastResult:
    date: datetime
    predicted_rate: float
    confidence_lower: float
    confidence_upper: float
    model_name: str

@dataclass
class ModelMetrics:
    mae: float
    mse: float
    rmse: float
    mape: float

class FeatureEngineering:
    """Feature engineering for hotel rate prediction"""
    
    @staticmethod
    def extract_date_features(df: pd.DataFrame, date_col: str = 'date') -> pd.DataFrame:
        """Extract date-based features"""
        df = df.copy()
        df[date_col] = pd.to_datetime(df[date_col])
        
        # Basic date features
        df['year'] = df[date_col].dt.year
        df['month'] = df[date_col].dt.month
        df['day'] = df[date_col].dt.day
        df['weekday'] = df[date_col].dt.weekday
        df['is_weekend'] = df['weekday'].isin([5, 6]).astype(int)
        df['day_of_year'] = df[date_col].dt.dayofyear
        df['week_of_year'] = df[date_col].dt.isocalendar().week
        df['quarter'] = df[date_col].dt.quarter
        
        # Seasonal features
        df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12)
        df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12)
        df['sin_weekday'] = np.sin(2 * np.pi * df['weekday'] / 7)
        df['cos_weekday'] = np.cos(2 * np.pi * df['weekday'] / 7)
        
        return df
    
    @staticmethod
    def add_lag_features(df: pd.DataFrame, target_col: str = 'rate', lags: List[int] = [1, 7, 30]) -> pd.DataFrame:
        """Add lagged features"""
        df = df.copy()
        df = df.sort_values('date')
        
        for lag in lags:
            df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)
        
        return df
    
    @staticmethod
    def add_rolling_features(df: pd.DataFrame, target_col: str = 'rate', windows: List[int] = [7, 14, 30]) -> pd.DataFrame:
        """Add rolling statistics features"""
        df = df.copy()
        df = df.sort_values('date')
        
        for window in windows:
            df[f'{target_col}_rolling_mean_{window}'] = df[target_col].rolling(window=window, min_periods=1).mean()
            df[f'{target_col}_rolling_std_{window}'] = df[target_col].rolling(window=window, min_periods=1).std()
            df[f'{target_col}_rolling_min_{window}'] = df[target_col].rolling(window=window, min_periods=1).min()
            df[f'{target_col}_rolling_max_{window}'] = df[target_col].rolling(window=window, min_periods=1).max()
        
        return df
    
    @staticmethod
    def add_competitive_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add competitive intelligence features"""
        df = df.copy()
        
        # Rate position relative to competitors
        if 'hotel_id' in df.columns:
            # Group by date and calculate competitive metrics
            date_groups = df.groupby('date')
            df['rate_rank'] = date_groups['rate'].rank(ascending=False)
            df['rate_percentile'] = date_groups['rate'].rank(pct=True)
            df['competitor_avg_rate'] = date_groups['rate'].transform('mean')
            df['rate_vs_avg'] = df['rate'] - df['competitor_avg_rate']
            df['rate_vs_avg_pct'] = (df['rate'] - df['competitor_avg_rate']) / df['competitor_avg_rate'] * 100
        
        return df

class RateForecastingModel:
    """Base class for rate forecasting models"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.is_trained = False
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare data for training/prediction"""
        # Feature engineering
        df = FeatureEngineering.extract_date_features(df)
        df = FeatureEngineering.add_lag_features(df)
        df = FeatureEngineering.add_rolling_features(df)
        df = FeatureEngineering.add_competitive_features(df)
        
        # Select features (exclude non-numeric and target)
        exclude_cols = ['date', 'rate', 'hotel_id', 'source', 'room_type', 'scraped_at']
        feature_cols = [col for col in df.columns if col not in exclude_cols and df[col].dtype in [np.int64, np.float64]]
        
        # Handle missing values
        df[feature_cols] = df[feature_cols].fillna(method='ffill').fillna(0)
        
        self.feature_columns = feature_cols
        
        X = df[feature_cols]
        y = df['rate'] if 'rate' in df.columns else None
        
        return X, y
    
    def train(self, df: pd.DataFrame) -> ModelMetrics:
        """Train the model"""
        raise NotImplementedError
    
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Make predictions"""
        raise NotImplementedError
    
    def save_model(self, filepath: str):
        """Save trained model"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'model_name': self.model_name
        }
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.model_name = model_data['model_name']
        self.is_trained = True
        logger.info(f"Model loaded from {filepath}")

class RandomForestForecastingModel(RateForecastingModel):
    """Random Forest model for rate forecasting"""
    
    def __init__(self):
        super().__init__("Random Forest")
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
    
    def train(self, df: pd.DataFrame) -> ModelMetrics:
        """Train Random Forest model"""
        X, y = self.prepare_data(df)
        
        # Split data
        train_size = int(0.8 * len(X))
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        metrics = self._calculate_metrics(y_test, y_pred)
        
        logger.info(f"Random Forest trained - MAE: {metrics.mae:.2f}, RMSE: {metrics.rmse:.2f}")
        return metrics
    
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Make predictions with Random Forest"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X, _ = self.prepare_data(df)
        X_scaled = self.scaler.transform(X[self.feature_columns])
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> ModelMetrics:
        """Calculate model performance metrics"""
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        
        return ModelMetrics(mae=mae, mse=mse, rmse=rmse, mape=mape)

class ProphetForecastingModel:
    """Prophet model for time series forecasting"""
    
    def __init__(self):
        self.model_name = "Prophet"
        self.model = None
        self.is_trained = False
    
    def train(self, df: pd.DataFrame) -> Optional[ModelMetrics]:
        """Train Prophet model"""
        if not PROPHET_AVAILABLE:
            logger.warning("Prophet not available, skipping Prophet model training")
            return None
        
        # Prepare data for Prophet (needs 'ds' and 'y' columns)
        prophet_df = df[['date', 'rate']].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df = prophet_df.sort_values('ds')
        
        # Remove duplicates and handle missing values
        prophet_df = prophet_df.dropna()
        prophet_df = prophet_df.drop_duplicates(subset=['ds'])
        
        # Initialize and train Prophet
        self.model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10,
            holidays_prior_scale=10,
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True
        )
        
        self.model.fit(prophet_df)
        self.is_trained = True
        
        logger.info("Prophet model trained successfully")
        return None  # Prophet has its own cross-validation methods
    
    def predict(self, dates: List[datetime]) -> List[ForecastResult]:
        """Make predictions with Prophet"""
        if not self.is_trained or not PROPHET_AVAILABLE:
            raise ValueError("Prophet model must be trained and available")
        
        # Create future dataframe
        future_df = pd.DataFrame({'ds': dates})
        
        # Make predictions
        forecast = self.model.predict(future_df)
        
        # Convert to ForecastResult objects
        results = []
        for _, row in forecast.iterrows():
            result = ForecastResult(
                date=row['ds'],
                predicted_rate=row['yhat'],
                confidence_lower=row['yhat_lower'],
                confidence_upper=row['yhat_upper'],
                model_name=self.model_name
            )
            results.append(result)
        
        return results

class ForecastingService:
    """Main service for rate forecasting"""
    
    def __init__(self):
        self.models = {
            'random_forest': RandomForestForecastingModel(),
            'prophet': ProphetForecastingModel()
        }
        self.model_dir = "models"
        os.makedirs(self.model_dir, exist_ok=True)
    
    def get_hotel_data(self, hotel_id: int, days_back: int = 365) -> pd.DataFrame:
        """Get historical rate data for a hotel"""
        db = SessionLocal()
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            rates = db.query(RateData, Hotel.name.label('hotel_name')).join(Hotel).filter(
                RateData.hotel_id == hotel_id,
                RateData.scraped_at >= cutoff_date
            ).order_by(RateData.date).all()
            
            if not rates:
                return pd.DataFrame()
            
            # Convert to DataFrame
            data = []
            for rate, hotel_name in rates:
                data.append({
                    'date': rate.date,
                    'rate': rate.rate,
                    'hotel_id': rate.hotel_id,
                    'hotel_name': hotel_name,
                    'source': rate.source,
                    'room_type': rate.room_type,
                    'availability': rate.availability,
                    'scraped_at': rate.scraped_at
                })
            
            df = pd.DataFrame(data)
            
            # Aggregate multiple rates per day (take average)
            df_agg = df.groupby(['date', 'hotel_id']).agg({
                'rate': 'mean',
                'hotel_name': 'first',
                'source': 'first',
                'room_type': 'first',
                'availability': 'any'
            }).reset_index()
            
            return df_agg
            
        finally:
            db.close()
    
    def train_models(self, hotel_id: int) -> Dict[str, Optional[ModelMetrics]]:
        """Train all available models for a hotel"""
        df = self.get_hotel_data(hotel_id)
        
        if df.empty:
            logger.warning(f"No data available for hotel {hotel_id}")
            return {}
        
        results = {}
        
        # Train Random Forest
        try:
            rf_metrics = self.models['random_forest'].train(df)
            results['random_forest'] = rf_metrics
            
            # Save model
            model_path = os.path.join(self.model_dir, f"rf_hotel_{hotel_id}.joblib")
            self.models['random_forest'].save_model(model_path)
            
        except Exception as e:
            logger.error(f"Error training Random Forest for hotel {hotel_id}: {e}")
            results['random_forest'] = None
        
        # Train Prophet
        try:
            prophet_metrics = self.models['prophet'].train(df)
            results['prophet'] = prophet_metrics
            
        except Exception as e:
            logger.error(f"Error training Prophet for hotel {hotel_id}: {e}")
            results['prophet'] = None
        
        return results
    
    def forecast_rates(self, hotel_id: int, days_ahead: int = 30) -> List[ForecastResult]:
        """Generate rate forecasts for a hotel"""
        
        # Generate future dates
        future_dates = [datetime.now() + timedelta(days=i) for i in range(1, days_ahead + 1)]
        
        all_forecasts = []
        
        # Random Forest predictions
        try:
            model_path = os.path.join(self.model_dir, f"rf_hotel_{hotel_id}.joblib")
            if os.path.exists(model_path):
                self.models['random_forest'].load_model(model_path)
                
                # Create DataFrame for prediction
                pred_df = pd.DataFrame({'date': future_dates})
                
                # Get recent data for feature engineering
                recent_data = self.get_hotel_data(hotel_id, days_back=90)
                if not recent_data.empty:
                    # Combine recent data with future dates
                    combined_df = pd.concat([recent_data, pred_df], ignore_index=True)
                    combined_df = combined_df.sort_values('date')
                    
                    # Make predictions
                    predictions = self.models['random_forest'].predict(combined_df)
                    
                    # Extract predictions for future dates
                    future_predictions = predictions[-len(future_dates):]
                    
                    for date, pred in zip(future_dates, future_predictions):
                        forecast = ForecastResult(
                            date=date,
                            predicted_rate=pred,
                            confidence_lower=pred * 0.9,  # Simple confidence interval
                            confidence_upper=pred * 1.1,
                            model_name="Random Forest"
                        )
                        all_forecasts.append(forecast)
                        
        except Exception as e:
            logger.error(f"Error making Random Forest predictions: {e}")
        
        # Prophet predictions
        try:
            if PROPHET_AVAILABLE and self.models['prophet'].is_trained:
                prophet_forecasts = self.models['prophet'].predict(future_dates)
                all_forecasts.extend(prophet_forecasts)
                
        except Exception as e:
            logger.error(f"Error making Prophet predictions: {e}")
        
        return all_forecasts
    
    def get_market_insights(self, hotel_id: int) -> Dict:
        """Generate market insights and competitive analysis"""
        db = SessionLocal()
        
        try:
            # Get hotel info
            hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
            if not hotel:
                return {}
            
            # Get recent rate data for the hotel and competitors in same location
            recent_date = datetime.utcnow() - timedelta(days=30)
            
            competitor_rates = db.query(RateData, Hotel.name.label('hotel_name')).join(Hotel).filter(
                Hotel.location == hotel.location,
                RateData.scraped_at >= recent_date
            ).all()
            
            if not competitor_rates:
                return {}
            
            # Analyze competitive position
            competitor_data = []
            for rate, hotel_name in competitor_rates:
                competitor_data.append({
                    'hotel_name': hotel_name,
                    'rate': rate.rate,
                    'is_target_hotel': rate.hotel_id == hotel_id
                })
            
            df = pd.DataFrame(competitor_data)
            
            # Calculate insights
            target_rates = df[df['is_target_hotel']]['rate']
            competitor_rates = df[~df['is_target_hotel']]['rate']
            
            if len(target_rates) > 0 and len(competitor_rates) > 0:
                insights = {
                    'avg_rate': float(target_rates.mean()),
                    'competitor_avg_rate': float(competitor_rates.mean()),
                    'rate_advantage': float(target_rates.mean() - competitor_rates.mean()),
                    'market_position': float(target_rates.mean()) / float(competitor_rates.mean()),
                    'price_percentile': float(target_rates.mean() > competitor_rates).mean() * 100,
                    'recommendations': self._generate_recommendations(target_rates.mean(), competitor_rates)
                }
                
                return insights
            
        except Exception as e:
            logger.error(f"Error generating market insights: {e}")
        finally:
            db.close()
        
        return {}
    
    def _generate_recommendations(self, target_rate: float, competitor_rates: pd.Series) -> List[str]:
        """Generate pricing recommendations based on competitive analysis"""
        recommendations = []
        
        competitor_avg = competitor_rates.mean()
        competitor_min = competitor_rates.min()
        competitor_max = competitor_rates.max()
        
        if target_rate > competitor_avg * 1.1:
            recommendations.append("Consider reducing rates to be more competitive")
        elif target_rate < competitor_avg * 0.9:
            recommendations.append("Opportunity to increase rates while remaining competitive")
        else:
            recommendations.append("Current pricing is well-positioned vs competitors")
        
        if target_rate > competitor_max:
            recommendations.append("You're pricing above all competitors - monitor demand closely")
        elif target_rate < competitor_min:
            recommendations.append("You're pricing below all competitors - potential revenue opportunity")
        
        return recommendations

# Background task for model training
async def train_all_models():
    """Background task to train models for all hotels"""
    service = ForecastingService()
    db = SessionLocal()
    
    try:
        hotels = db.query(Hotel).filter(Hotel.is_own == True).all()
        
        for hotel in hotels:
            try:
                logger.info(f"Training models for hotel: {hotel.name}")
                results = service.train_models(hotel.id)
                
                for model_name, metrics in results.items():
                    if metrics:
                        logger.info(f"  {model_name}: MAE={metrics.mae:.2f}, RMSE={metrics.rmse:.2f}")
                
            except Exception as e:
                logger.error(f"Error training models for hotel {hotel.name}: {e}")
                continue
                
    finally:
        db.close()

if __name__ == "__main__":
    # Test the forecasting service
    import asyncio
    
    async def test_forecasting():
        service = ForecastingService()
        
        # Test with hotel ID 1
        hotel_id = 1
        
        # Train models
        print("Training models...")
        results = service.train_models(hotel_id)
        print(f"Training results: {results}")
        
        # Generate forecasts
        print("Generating forecasts...")
        forecasts = service.forecast_rates(hotel_id, days_ahead=7)
        
        print(f"Generated {len(forecasts)} forecasts:")
        for forecast in forecasts[:5]:  # Show first 5
            print(f"  {forecast.date.strftime('%Y-%m-%d')}: ${forecast.predicted_rate:.2f} ({forecast.model_name})")
        
        # Get market insights
        print("Generating market insights...")
        insights = service.get_market_insights(hotel_id)
        print(f"Market insights: {insights}")
    
    asyncio.run(test_forecasting()) 