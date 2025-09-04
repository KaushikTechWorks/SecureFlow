-- Database Performance Optimization for Dashboard
-- Add indexes to improve query performance

-- Add indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_is_anomaly ON transactions(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_transactions_hour ON transactions(hour);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Add composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_anomaly ON transactions(timestamp, is_anomaly);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_hour ON transactions(timestamp, hour);

-- Add index for feedback joins
CREATE INDEX IF NOT EXISTS idx_feedback_transaction_id ON feedback(transaction_id);

-- Analyze tables for better query planning
ANALYZE transactions;
ANALYZE feedback;

-- Example query to verify index usage:
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT count(*), sum(CASE WHEN is_anomaly THEN 1 ELSE 0 END)
-- FROM transactions 
-- WHERE timestamp >= NOW() - INTERVAL '7 days';
