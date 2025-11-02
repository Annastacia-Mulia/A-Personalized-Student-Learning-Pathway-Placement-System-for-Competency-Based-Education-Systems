import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle

# STEP 1: Load Dataset (local file)
file_path = "StudentsPerformance.csv"  # Place this file in the same folder as this script

df = pd.read_csv(file_path)
print("✅ File loaded successfully!")
print(df.head())

# STEP 2: Clean and Prepare Data
# Normalize and clean column names
df.columns = df.columns.str.strip().str.lower()
# Rename to new consistent names
df.rename(columns={
    'math score': 'stem',
    'reading score': 'social_sciences',
    'writing score': 'arts'
}, inplace=True)
# Keep only the relevant columns
df = df[['stem', 'social_sciences', 'arts']]
print("\n✅ Cleaned dataset preview:")
print(df.head())

# STEP 3: Assign Pathways Based on Dominant Subject
def assign_pathway(row):
    scores = {'stem': row['stem'], 'social_sciences': row['social_sciences'], 'arts': row['arts']}
    dominant = max(scores, key=scores.get)
    if dominant == 'stem':
        return 'STEM'
    elif dominant == 'social_sciences':
        return 'Social Sciences'
    else:
        return 'Arts & Sports'

df['Pathway'] = df.apply(assign_pathway, axis=1)
print("\n✅ Pathways assigned successfully!")
print(df['Pathway'].value_counts())

# STEP 4: Train/Test Split + Tuned Random Forest
X = df[['stem', 'social_sciences', 'arts']]
y = df['Pathway']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features='sqrt',
    bootstrap=True,
    random_state=42
)
rf.fit(X_train, y_train)
y_pred = rf.predict(X_test)

print("\n🎯 Random Forest Performance:")
print("Accuracy:", round(accuracy_score(y_test, y_pred)*100, 2), "%")
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# STEP 5: Export Model
with open("pathguider.pkl", "wb") as f:
    pickle.dump(rf, f)
print("✅ Model exported as pathguider.pkl")

# STEP 6: Export Results
output_path = "StudentPathwayResults.csv"
df.to_csv(output_path, index=False)
print(f"✅ Results saved to: {output_path}")
print(df.head())
