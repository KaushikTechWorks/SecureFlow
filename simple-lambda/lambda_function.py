import json
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

def lambda_handler(event, context):
    """
    Simple Lambda handler that logs the event and returns a response
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Check if this is an API Gateway event
        if 'httpMethod' in event and 'path' in event:
            # This is an API Gateway event
            http_method = event['httpMethod']
            path = event['path']
            
            logger.info(f"API Gateway event - Method: {http_method}, Path: {path}")
            
            # Handle different paths
            if path == '/api/health' or path == '/health':
                response_body = {
                    "status": "healthy",
                    "message": "SecureFlow API is running",
                    "version": "1.0"
                }
            elif path == '/api/transactions' or path == '/transactions':
                response_body = {
                    "transactions": [],
                    "message": "No transactions found"
                }
            else:
                response_body = {
                    "message": f"Path {path} not found",
                    "available_paths": ["/api/health", "/api/transactions"]
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                },
                'body': json.dumps(response_body)
            }
        else:
            # Direct Lambda invocation
            logger.info("Direct Lambda invocation")
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                },
                'body': json.dumps({
                    "message": "Welcome to SecureFlow API",
                    "version": "1.0"
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                "error": "Internal server error",
                "message": str(e)
            })
        }
