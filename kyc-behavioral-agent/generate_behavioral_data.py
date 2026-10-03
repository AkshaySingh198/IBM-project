import pandas as pd
import numpy as np

np.random.seed(42)

rows = 3000

data = {
    "Amount": np.random.lognormal(mean=10, sigma=1, size=rows),
    "FailedLoginAttempts": np.random.poisson(lam=1, size=rows),
    "FilesAccessed": np.random.poisson(lam=5, size=rows),
    "SessionDuration": np.random.normal(loc=60, scale=20, size=rows),
    "AfterHoursAccess": np.random.binomial(1, 0.08, size=rows),
    "ExternalDevice": np.random.binomial(1, 0.05, size=rows),
}

df = pd.DataFrame(data)

df.to_csv("behavioral_training_data.csv", index=False)

print(f"Generated {len(df)} behavioral training records.")
