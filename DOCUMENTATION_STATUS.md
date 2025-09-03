# Documentation Architecture Status

This file tracks the status of all architecture-related documentation in the SecureFlow project.

## Current Architecture (Active ✅)

**Platform**: Fly.io  
**Documentation**:
- `README.md` - Main project documentation with current Fly.io deployment
- `FLY_CURRENT_ARCHITECTURE.md` - Detailed current architecture documentation
- `backend/fly.toml` - Backend Fly.io configuration
- `frontend/fly.toml` - Frontend Fly.io configuration
- `frontend/README.md` - Frontend-specific Fly.io deployment guide

## Previous Architecture (Legacy 📋)

**Platform**: AWS (Lambda + API Gateway + CloudFront + S3)  
**Status**: Preserved for reference  
**Documentation**:
- `AWS_DEPLOYMENT.md` - Complete AWS deployment guide (marked as previous)
- `ARCHITECTURE_SUMMARY.md` - Evolution timeline with both architectures
- `aws/README.md` - AWS infrastructure files explanation
- `aws/infrastructure.yml` - CloudFormation template (functional)
- `aws/backend-infrastructure.yml` - Backend CloudFormation template
- `lambda/README.md` - Lambda backend implementation (marked as legacy)
- `lambda/` directory - Complete Lambda backend code

## Removed Architecture ❌

**Platform**: ECS/Docker Compose  
**Status**: Completely removed  
**Reason**: Too complex, replaced by simpler approaches

## Quick Reference

| Need | Documentation File |
|------|-------------------|
| **Deploy to Fly.io (current)** | `README.md` → Quick Start |
| **Understand current architecture** | `FLY_CURRENT_ARCHITECTURE.md` |
| **Deploy to AWS (if needed)** | `AWS_DEPLOYMENT.md` |
| **See architecture evolution** | `ARCHITECTURE_SUMMARY.md` |
| **AWS infrastructure code** | `aws/infrastructure.yml` |
| **Lambda backend code** | `lambda/app.py` |

## Documentation Update Policy

- ✅ **Current architecture**: Keep up-to-date, reflect production reality
- 📋 **Previous architecture**: Preserve for reference, clearly mark as legacy
- ❌ **Removed architecture**: Delete to avoid confusion

**Last Updated**: September 3, 2025
