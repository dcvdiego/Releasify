#!/usr/bin/env python3
"""
Release Date Prediction Model
Predicts the next album release date based on historical release patterns
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split


def parse_release_dates(dates):
    """Parse release dates and handle different precisions (year, month, day)"""
    parsed_dates = []
    for date_str in dates:
        try:
            # Try full date first (YYYY-MM-DD)
            if len(date_str) == 10:
                parsed_dates.append(datetime.strptime(date_str, '%Y-%m-%d'))
            # Month precision (YYYY-MM)
            elif len(date_str) == 7:
                parsed_dates.append(datetime.strptime(date_str + '-15', '%Y-%m-%d'))
            # Year precision (YYYY)
            elif len(date_str) == 4:
                parsed_dates.append(datetime.strptime(date_str + '-07-01', '%Y-%m-%d'))
        except:
            continue
    return sorted(parsed_dates)


def calculate_gaps(dates):
    """Calculate time gaps between consecutive releases in days"""
    gaps = []
    for i in range(1, len(dates)):
        gap = (dates[i] - dates[i-1]).days
        gaps.append(gap)
    return gaps


def create_features(dates):
    """Create features from release dates for ML model"""
    features = []
    for date in dates:
        features.append([
            date.month,
            date.day,
            date.weekday(),
            (date.day - 1) // 7 + 1,  # Week of month
            1 if date.month in [1, 2, 12] else 0,  # Winter release
            1 if date.month in [3, 4, 5] else 0,   # Spring release
            1 if date.month in [6, 7, 8] else 0,   # Summer release
            1 if date.month in [9, 10, 11] else 0  # Fall release
        ])
    return features


def predict_next_release(dates_input):
    """
    Predict the next release date using machine learning
    """
    dates = parse_release_dates(dates_input)

    if len(dates) < 3:
        raise ValueError(f"Insufficient data: only {len(dates)} releases found, need at least 3")

    # Calculate gaps between releases
    gaps = calculate_gaps(dates)

    if len(gaps) < 2:
        # Not enough data for ML, use simple average
        avg_gap = np.mean(gaps) if gaps else 365
        predicted_date = dates[-1] + timedelta(days=int(avg_gap))

        return {
            'predicted_date': predicted_date.strftime('%Y-%m-%d'),
            'confidence': 0.5,
            'model_used': 'average'
        }

    # Prepare training data
    X_features = []
    y_targets = []

    for i in range(len(dates) - 1):
        # Features: month, day, weekday, week of month, and seasonal flags
        features = [
            dates[i].month,
            dates[i].day,
            dates[i].weekday(),
            (dates[i].day - 1) // 7 + 1,
            1 if dates[i].month in [1, 2, 12] else 0,
            1 if dates[i].month in [3, 4, 5] else 0,
            1 if dates[i].month in [6, 7, 8] else 0,
            1 if dates[i].month in [9, 10, 11] else 0,
        ]
        X_features.append(features)
        # Target: days until next release
        y_targets.append(gaps[i])

    X = np.array(X_features)
    y = np.array(y_targets)

    # Use Random Forest for prediction
    if len(X) >= 5:
        # Enough data for train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, shuffle=False
        )
        model = RandomForestRegressor(
            n_estimators=50,
            max_depth=5,
            random_state=42,
            min_samples_split=2
        )
        model.fit(X_train, y_train)

        # Calculate confidence based on model performance
        if len(X_test) > 0:
            predictions = model.predict(X_test)
            mae = np.mean(np.abs(predictions - y_test))
            # Confidence inversely proportional to error (normalized)
            confidence = max(0.3, min(0.95, 1 - (mae / 365)))
        else:
            confidence = 0.7
    else:
        # Use all data for training
        model = RandomForestRegressor(
            n_estimators=50,
            max_depth=5,
            random_state=42
        )
        model.fit(X, y)
        confidence = 0.6  # Lower confidence with limited data

    # Predict next release
    last_date = dates[-1]
    last_features = np.array([[
        last_date.month,
        last_date.day,
        last_date.weekday(),
        (last_date.day - 1) // 7 + 1,
        1 if last_date.month in [1, 2, 12] else 0,
        1 if last_date.month in [3, 4, 5] else 0,
        1 if last_date.month in [6, 7, 8] else 0,
        1 if last_date.month in [9, 10, 11] else 0,
    ]])

    predicted_gap = model.predict(last_features)[0]

    # Ensure prediction is reasonable (between 90 days and 5 years)
    predicted_gap = max(90, min(1825, predicted_gap))

    predicted_date = last_date + timedelta(days=int(predicted_gap))

    # Ensure predicted date is in the future
    today = datetime.now()
    if predicted_date < today:
        # Adjust to next likely window based on average gap
        avg_gap = np.mean(gaps)
        predicted_date = today + timedelta(days=int(avg_gap * 0.5))

    return {
        'predicted_date': predicted_date.strftime('%Y-%m-%d'),
        'confidence': round(float(confidence), 2),
        'model_used': 'random_forest'
    }


if __name__ == '__main__':
    try:
        # Get input from command line
        if len(sys.argv) < 2:
            raise ValueError("No input data provided")

        input_data = json.loads(sys.argv[1])
        dates = input_data.get('dates', [])

        if not dates:
            raise ValueError("No dates provided")

        # Make prediction
        result = predict_next_release(dates)

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'error': str(e),
            'predicted_date': None,
            'confidence': 0,
            'model_used': 'none'
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)
