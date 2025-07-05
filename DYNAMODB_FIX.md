# DynamoDB Float Type Fix

## Issue Description
CloudWatch logs showed the error:
```
Error storing transaction in DynamoDB: Float types are not supported. Use Decimal types instead.
```

## Root Cause Analysis

### Why This Happens Only in Lambda (Not Locally)
- **Lambda Environment**: Uses DynamoDB which requires `Decimal` types for numeric values
- **Local Environment**: Uses SQLite which accepts Python `float` types natively
- **Conclusion**: This is a **Lambda-specific issue** due to DynamoDB's strict type requirements

### Specific Problem Location
The issue was in the `handle_predict()` function in `lambda/lambda_function.py`:

```python
# BEFORE (Problematic):
shap_explanation = {
    'amount': 0.3 if amount > 1000 else -0.1,
    'hour': 0.4 if hour < 6 or hour > 22 else -0.05,
    'day_of_week': random.uniform(-0.1, 0.1),        # ❌ Float
    'merchant_category': random.uniform(-0.15, 0.15), # ❌ Float  
    'transaction_type': random.uniform(-0.1, 0.1)     # ❌ Float
}
```

```python
# AFTER (Fixed):
shap_explanation = {
    'amount': Decimal('0.3') if amount > 1000 else Decimal('-0.1'),
    'hour': Decimal('0.4') if hour < 6 or hour > 22 else Decimal('-0.05'),
    'day_of_week': Decimal(str(round(random.uniform(-0.1, 0.1), 3))),
    'merchant_category': Decimal(str(round(random.uniform(-0.15, 0.15), 3))),
    'transaction_type': Decimal(str(round(random.uniform(-0.1, 0.1), 3)))
}
```

## Solution Applied
1. ✅ Converted all `shap_explanation` float values to `Decimal` types
2. ✅ Used `Decimal(str(round(value, 3)))` for random values to maintain precision
3. ✅ Used direct `Decimal('value')` for static values
4. ✅ Tested conversion compatibility

## Testing Verification
- All values are now `Decimal` types compatible with DynamoDB
- JSON serialization works correctly for API responses
- No impact on frontend functionality (Decimal converts to float in JSON)

## Deployment Instructions
1. Update the Lambda function with the fixed code
2. Deploy using your existing deployment method
3. Test with a transaction to verify CloudWatch logs show successful DynamoDB storage

## Other Considerations
- **Backend (Local)**: No changes needed - SQLite handles floats fine
- **Frontend**: No changes needed - receives the same JSON structure
- **Future**: When adding new numeric fields to DynamoDB storage, always use `Decimal` types

## Files Modified
- `lambda/lambda_function.py` - Fixed `shap_explanation` generation in `handle_predict()`
