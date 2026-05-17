# Sentinel API

All protected routes accept `Authorization: Bearer <api-key>` or `X-API-Key: <api-key>`.

## Public

- `GET /health`
- `GET /v1/status`
- `GET /v1/sources`
- `POST /v1/api-keys`

## Account And Keys

- `GET /v1/me`
- `GET /v1/me/usage`
- `GET /v1/api-keys`
- `DELETE /v1/api-keys/:id`

API keys are generated once. Sentinel stores only a keyed hash plus a prefix.

## Mantle Intelligence

- `GET /v1/mantle/assets/:address/summary`
- `GET /v1/mantle/assets/:address/holders`
- `GET /v1/mantle/assets/:address/concentration`
- `GET /v1/mantle/signals/liquidity-delta`
- `POST /v1/query`

Every Mantle response includes metadata:

```json
{
  "metadata": {
    "source": "sentinel-demo-provider",
    "freshness": "demo snapshot",
    "indexed_until_block": 70234121,
    "confidence": "medium",
    "is_partial": true,
    "warnings": ["Demo data is partial and not complete chain coverage."]
  }
}
```

## Rate Limits

Protected routes return:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` on `429`
