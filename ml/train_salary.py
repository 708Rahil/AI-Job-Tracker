import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

# ── Generate synthetic dataset for demo ─────────────────────
np.random.seed(42)
n = 500

data = pd.DataFrame({
    "title_score":         np.random.randint(1, 5, n),
    "skill_score":         np.random.randint(1, 15, n),
    "years_experience":    np.random.uniform(0, 15, n),
    "location_multiplier": np.random.choice([1.0, 1.1, 1.2, 1.4, 1.6], n),
})

# Salary formula with noise
data["salary"] = (
    data["title_score"] * 15000
    + data["skill_score"] * 2000
    + data["years_experience"] * 3000
    + data["location_multiplier"] * 20000
    + np.random.normal(0, 5000, n)
)

data.to_csv("data/salary_dataset.csv", index=False)

# ── Train ────────────────────────────────────────────────────
X = data[["title_score", "skill_score", "years_experience", "location_multiplier"]]
y = data["salary"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ── Evaluate ─────────────────────────────────────────────────
preds = model.predict(X_test)
print(f"MAE:  ${mean_absolute_error(y_test, preds):,.0f}")
print(f"RMSE: ${mean_squared_error(y_test, preds, squared=False):,.0f}")

# ── Save ─────────────────────────────────────────────────────
with open("salary_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved to salary_model.pkl")