import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

def generate_synthetic_transactions(n_normal=1000, n_anomalous=100):
    """Generate synthetic transaction data for testing"""
    np.random.seed(42)
    
    # Generate normal transactions
    normal_transactions = []
    for i in range(n_normal):
        # Define normalized probabilities that sum to exactly 1
        hour_probs = [0.05, 0.1, 0.15, 0.2, 0.15, 0.1, 0.08, 0.07, 0.05, 0.03, 0.015, 0.01, 0.005, 0.005]
        hour_probs = [p / sum(hour_probs) for p in hour_probs]  # Normalize to sum to 1
        
        transaction = {
            'amount': np.random.lognormal(3, 1),  # Log-normal distribution for amounts
            'hour': np.random.choice(range(8, 22), p=hour_probs),
            'day_of_week': np.random.choice(range(7), p=[0.1, 0.15, 0.15, 0.15, 0.15, 0.2, 0.1]),  # Weekdays more common
            'merchant_category': np.random.choice(range(10), p=[0.2, 0.15, 0.1, 0.1, 0.1, 0.1, 0.08, 0.07, 0.05, 0.05]),
            'transaction_type': np.random.choice(range(3), p=[0.6, 0.3, 0.1])  # 0: purchase, 1: withdrawal, 2: transfer
        }
        normal_transactions.append(transaction)
    
    # Generate anomalous transactions
    anomalous_transactions = []
    for i in range(n_anomalous):
        # Different types of anomalies
        anomaly_type = np.random.choice(['high_amount', 'unusual_time', 'unusual_pattern'])
        
        if anomaly_type == 'high_amount':
            transaction = {
                'amount': np.random.uniform(1000, 5000),  # Very high amounts
                'hour': np.random.choice(range(24)),
                'day_of_week': np.random.choice(range(7)),
                'merchant_category': np.random.choice(range(10)),
                'transaction_type': np.random.choice(range(3))
            }
        elif anomaly_type == 'unusual_time':
            transaction = {
                'amount': np.random.lognormal(3, 1),
                'hour': np.random.choice([0, 1, 2, 3, 4, 5]),  # Very early hours
                'day_of_week': np.random.choice(range(7)),
                'merchant_category': np.random.choice(range(10)),
                'transaction_type': np.random.choice(range(3))
            }
        else:  # unusual_pattern
            transaction = {
                'amount': np.random.uniform(500, 1500),
                'hour': np.random.choice([22, 23, 0, 1, 2]),
                'day_of_week': np.random.choice([5, 6]),  # Weekend
                'merchant_category': 9,  # Unusual category
                'transaction_type': 2  # Transfer
            }
        
        anomalous_transactions.append(transaction)
    
    # Combine all transactions
    all_transactions = normal_transactions + anomalous_transactions
    
    # Create DataFrame
    df = pd.DataFrame(all_transactions)
    
    # Add labels (1 for normal, -1 for anomaly - to match IsolationForest output)
    labels = [1] * n_normal + [-1] * n_anomalous
    df['label'] = labels
    
    # Shuffle the data
    df = df.sample(frac=1).reset_index(drop=True)
    
    return df

def save_sample_data():
    """Generate and save sample data as CSV"""
    df = generate_synthetic_transactions(1000, 100)
    df.to_csv('sample_transactions.csv', index=False)
    print(f"Generated {len(df)} transactions and saved to sample_transactions.csv")
    print(f"Normal transactions: {len(df[df['label'] == 1])}")
    print(f"Anomalous transactions: {len(df[df['label'] == -1])}")
    
    return df

if __name__ == "__main__":
    save_sample_data()
