import json

def lambda_handler(event, context):
    """Simple working Lambda function"""
    
    # Log the event for debugging
    print(f"Event: {json.dumps(event)}")
    
    # Extract path and method
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # Simple routing
    if path == '/health' or path == '/api/health':
        response_body = {
            'status': 'healthy',
            'message': 'SecureFlow API is working!',
            'method': http_method,
            'path': path
        }
    elif path == '/' or path == '/api':
        response_body = {
            'message': 'SecureFlow API is running',
            'version': '2.0-serverless-simple',
            'endpoints': ['/health', '/api/health']
        }
    else:
        response_body = {
            'error': 'Not Found',
            'path': path,
            'method': http_method
        }
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps(response_body)
    }
