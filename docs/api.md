# Sentinel API

All protected routes accept `Authorization: Bearer <api-key>` or `X-API-Key: <api-key>`.

Preferred public contract routes use stable envelopes:

```json
{ "data": {}, "meta": { "source": "sentinel", "partial": false, "stale": false } }
```

```json
{ "error": { "code": "NOT_INDEXED_YET", "message": "This data is not indexed yet.", "details": {} } }
```

## Public

- `GET /health`
- `GET /v1/status`
- `GET /v1/chains`
- `GET /v1/networks`
- `GET /v1/capabilities`
- `POST /v1/api-keys`

## Scan And Tokens

- `GET /v1/scan/search?q=BTC`
- `GET /v1/addresses/:chain/:network/:address`
- `GET /v1/tokens/:chain/:network/:token_address`
- `GET /v1/tokens/:chain/:network/:token_address/holders`
- `GET /v1/tokens/:chain/:network/:token_address/transfers`
- `GET /v1/transactions/:chain/:network/:tx_hash`

Alpha 1 exposes partial Mantle mainnet demo token summaries and holders. Transfers, address summaries, and transaction lookups return honest `NOT_INDEXED_YET` errors until the EVM indexer is connected.

## Prices

- `GET /v1/prices/assets`
- `GET /v1/prices/latest?asset=BTC&quote=USD`
- `GET /v1/prices/history?asset=BTC&quote=USD&range=7d`
- `GET /v1/prices/at?asset=BTC&quote=USD&timestamp=...`

Price routes require an API key. Sentinel reads through a private price service when configured and does not expose the private URL or token. The legacy `symbol` query param is still accepted.

## Infrastructure

- `GET /v1/infra/status`
- `GET /v1/infra/routes`
- `GET /v1/infra/routes/:route_id`

Alpha 1 exposes only safe public infrastructure metadata. Raw RPC is not public.

## NEAR

- `GET /v1/near/validators`
- `GET /v1/near/validators/:account_id`
- `GET /v1/near/validators/:account_id/snapshots`
- `GET /v1/near/validators/:account_id/status`

These routes are contract placeholders in Alpha 1 and return `NOT_CONNECTED_YET`.

## Account And Keys

- `GET /v1/me`
- `GET /v1/me/api-keys`
- `GET /v1/me/usage`
- `GET /v1/me/rate-limits`
- `DELETE /v1/api-keys/:id`

API keys are generated once. Sentinel stores only a keyed hash plus a prefix.

## Signals And Query

- `GET /v1/signals`
- `GET /v1/signals/:signal_id`
- `POST /v1/sentinel/query`

## Legacy Compatibility Aliases

These routes remain available for the current demo UI and older clients:

- `GET /v1/sources`
- `GET /v1/api-keys`
- `GET /v1/mantle/assets/:address/summary`
- `GET /v1/mantle/assets/:address/holders`
- `GET /v1/mantle/assets/:address/concentration`
- `GET /v1/mantle/signals/liquidity-delta`
- `GET /v1/prices/series`
- `POST /v1/query`

## Rate Limits

Protected routes return:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` on `429`
