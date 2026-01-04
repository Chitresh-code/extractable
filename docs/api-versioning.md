# API Versioning Strategy

## Overview

Extractable uses URL path-based API versioning to maintain backward compatibility while allowing iterative development.

## Version Format

API versions are specified in the URL path:

```
/api/v1/extractions
/api/v2/extractions  (future)
```

## Current Versions

- **v1**: Current stable version

## Versioning Policy

### Backward Compatibility

- At least one previous version is maintained
- Breaking changes require a new version
- Deprecation warnings in response headers

### Deprecation Process

1. Announce deprecation (6 months notice)
2. Add deprecation header to responses
3. Update documentation
4. Remove deprecated version after notice period

### Adding New Versions

1. Create new version directory: `app/api/v2/`
2. Copy and modify routes from previous version
3. Update versioning utilities
4. Update documentation
5. Deploy alongside existing versions

## Migration Guide

### From v1 to v2 (Example)

When v2 is released:

1. Review changelog for breaking changes
2. Update API client base URL
3. Update request/response models
4. Test thoroughly
5. Deploy updated client

## Version Detection

Clients can check available versions:

```http
GET /api/versions
```

Response:
```json
{
  "current_version": "v1",
  "supported_versions": ["v1"]
}
```

## Best Practices

- Always specify version in API calls
- Monitor deprecation headers
- Plan migrations in advance
- Test with new versions before switching
- Keep documentation updated

