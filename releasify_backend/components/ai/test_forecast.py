import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
import xgboost as xgb
from sklearn import metrics
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
# Data manipulation
# Manipulation with dates
# Machine learning
import numpy as np

data = pd.DataFrame({'Date': [
    '2020-12-18',
    '2020-01-17',
    '2018-08-31',
    '2017-12-15',
    '2017-12-14',
    '2013-11-05',
    '2013-01-01',
    '2010-06-21',
    '2010-06-18',
    '2009-05-15',
    '2006-01-01',
    '2004-11-12',
    '2002-05-26',
    '2001-08-20',
    '2000-05-23',
    '1999-02-23'
]})

data['Date'] = pd.to_datetime(data['Date'])
data['Release'] = 1

r = pd.date_range(start=data['Date'].min(), end=data['Date'].max())
data = data.set_index('Date').reindex(r).fillna(
    0.0).rename_axis('Date').reset_index()


data['Month'] = data['Date'].dt.month
data['Day'] = data['Date'].dt.day
data['Workday_N'] = np.busday_count(
    data['Date'].values.astype('datetime64[M]'),
    data['Date'].values.astype('datetime64[D]'))
data['Week_day'] = data['Date'].dt.weekday
data['Week_of_month'] = (data['Date'].dt.day
                         - data['Date'].dt.weekday - 2) // 7 + 2
data['Weekday_order'] = (data['Date'].dt.day + 6) // 7
data = data.set_index('Date')

x_train, x_test, y_train, y_test = train_test_split(data.drop(['Release'], axis=1), data['Release'],
                                                    test_size=0.3, random_state=1, shuffle=False)

# DM_train = xgb.DMatrix(data=x_train, label=y_train)
# grid_param = {"learning_rate": [0.01, 0.1],
#               "n_estimators": [100, 150, 200],
#               "alpha": [0.1, 0.5, 1],
#               "max_depth": [2, 3, 4]}
# model = xgb.XGBRegressor()
# grid_mse = GridSearchCV(estimator=model, param_grid=grid_param,
#                         scoring="neg_mean_squared_error",
#                         cv=4, verbose=1)
# grid_mse.fit(x_train, y_train)
# print("Best parameters found: ", grid_mse.best_params_)
# print("Lowest RMSE found: ", np.sqrt(np.abs(grid_mse.best_score_)))


# xgb_model = xgb.XGBClassifier(objective='reg:squarederror',
#                               colsample_bytree=1,
#                               learning_rate=0.1,
#                               max_depth=4,
#                               alpha=0.5,
#                               n_estimators=200)
# xgb_model.fit(x_train, y_train)
# xgb_prediction = xgb_model.predict(x_test)

knn = KNeighborsClassifier(n_neighbors=3, algorithm='auto',
                           weights='distance')
knn.fit(x_train, y_train)
knn_prediction = knn.predict(x_test)

random_forest = RandomForestClassifier(n_estimators=50,
                                       max_depth=10, random_state=1)
random_forest.fit(x_train, y_train)
rf_prediction = random_forest.predict(x_test)


# xgb_matrix = metrics.confusion_matrix(xgb_prediction, y_test)
# print(f"""
# Confusion matrix for XGBoost model:
# TN:{xgb_matrix[0][0]}    FN:{xgb_matrix[0][1]}
# FP:{xgb_matrix[1][0]}    TP:{xgb_matrix[1][1]}""")
knn_matrix = metrics.confusion_matrix(knn_prediction, y_test)
print(f"""
Confusion matrix for KNN model:
TN:{knn_matrix[0][0]}    FN:{knn_matrix[0][1]}
FP:{knn_matrix[1][0]}    TP:{knn_matrix[1][1]}""")
rf_matrix = metrics.confusion_matrix(rf_prediction, y_test)
print(f"""
Confusion matrix for Random Forest model:
TN:{rf_matrix[0][0]}    FN:{rf_matrix[0][1]}
FP:{rf_matrix[1][0]}    TP:{rf_matrix[1][1]}""")
