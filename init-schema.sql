-- Updated schema to match current backend models
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  amount FLOAT NOT NULL,
  hour INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  merchant_category INTEGER NOT NULL,
  transaction_type INTEGER NOT NULL,
  anomaly_score FLOAT NOT NULL,
  is_anomaly BOOLEAN NOT NULL,
  shap_explanation TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  user_feedback BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_is_anomaly ON transactions(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_transactions_hour ON transactions(hour);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_anomaly ON transactions(timestamp, is_anomaly);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_hour ON transactions(timestamp, hour);
CREATE INDEX IF NOT EXISTS idx_feedback_transaction_id ON feedback(transaction_id);
