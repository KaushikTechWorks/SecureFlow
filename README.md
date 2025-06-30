# SecureFlow

SecureFlow is a full-stack web application for real-time financial transaction anomaly detection, targeting 95% recall and <3-second latency, addressing the $40B financial scam problem in 2025

SecureFlow is designed to detect suspicious financial transactions (e.g., credit card fraud) in real-time, flagging potential scams with high accuracy (95% recall, <3s latency) using an Isolation Forest or Autoencoder model, with SHAP explanations. While the app’s interface allows manual user input (single transactions or CSV batches) for analysis, its primary use case is to assist banks, financial institutions, or users in identifying and responding to fraud quickly, reducing the impact of scams. 

Here’s how it addresses scam prevention, even with post-transaction input:
**Real-Time Detection for Recent Transactions**:
  How It Works: Users (or bank systems) input transaction details (e.g., $1,000 at 2 AM) via the React front end (Home or Batch Upload routes). The Flask API invokes the SageMaker-hosted model, which predicts if the transaction is suspicious (anomaly) in <3 seconds, providing SHAP explanations (e.g., “Flagged due to high amount at unusual time”).
  **Prevention Aspect**: Many financial scams (e.g., unauthorized credit card charges) can be reversed if caught quickly (within hours or days). SecureFlow’s fast detection (<3s) allows banks to flag and freeze suspicious transactions before funds are fully transferred or withdrawn, preventing losses. For example, a user noticing a strange charge can input it and get an immediate alert to contact their bank.
**Non-Technical Analogy**: It’s like a security guard who checks your bank statement right after a purchase and yells, “Stop! That looks fishy!” so you can call the bank to cancel it before the scammer gets away.

**Batch Processing for Monitoring**:
  How It Works: The Batch Upload route allows users (or banks) to upload a CSV of multiple transactions (e.g., 10–100 records), which SecureFlow processes to identify patterns of fraud. Results are displayed in a table with explanations, and alerts (via SNS email/SMS) are triggered for high-risk transactions (>90% anomaly probability).
  Prevention Aspect: Banks can use batch processing to monitor recent transactions in bulk (e.g., daily customer activity), catching scams that might have slipped through initial checks. This proactive monitoring helps stop fraudulent patterns before further transactions occur, reducing financial loss.
  Example: A bank uploads a day’s transactions, SecureFlow flags 5 suspicious ones, and the bank freezes those accounts within minutes.

**Feedback and Alerts for Proactive Response**:
  How It Works: The Feedback/Alerts route lets users confirm if flagged transactions are correct (stored in S3/RDS for model improvement) and set custom alert thresholds (e.g., >90% probability triggers SNS notifications). The Dashboard visualizes trends (e.g., anomaly frequency) with Chart.js.
  Prevention Aspect: Alerts notify users or banks instantly via email/SMS, enabling rapid action (e.g., freezing a card, contacting the user). Feedback improves the model over time, making future detections more accurate and preventing scams earlier.
**Non-Technical Analogy**: It’s like getting a text from your bank saying, “Hey, this purchase looks weird—check it now!” so you can stop it before more money is taken.

**Intended Use Case**:For Users: SecureFlow acts as a verification tool for individuals checking recent transactions (e.g., after noticing a charge). By flagging scams quickly, it empowers users to report issues to their bank before funds are lost.
For Banks: The app integrates with banking systems (via API) to process transactions in near real-time, flagging anomalies during or immediately after processing, preventing fraudulent transfers from completing.
Technical Note: The Flask API’s low-latency design (<3s, optimized with SageMaker Neo) supports near-real-time analysis, suitable for bank integration where transactions are checked as they occur.




