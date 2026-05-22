You are working in the Iron Burrow Sentinel API repository.

Goal:
Evaluate the current Sentinel API routes, handlers, contracts, response shapes, and internal service integrations. Compare the existing implementation against the proposed public `/v1/*` contract map below. Produce a clear equivalence report and a minimal migration plan.

Context:
Sentinel API is the public boundary of Iron Burrow. It should expose stable public API contracts while hiding internal service names and implementation details.

Internal services may include:
- price-indexer
- infra-gateway / Bigwig
- evm-transfer-indexer or future EVM event indexer
- near-validator-indexer
- Postgres schemas owned by individual services
- Sentinel-owned auth, usage, and rate-limit tables

Design principle:
Internal services can change. Sentinel public contracts should stay stable.

Important:
Do not blindly rewrite the app.
First inspect what already exists.
Then compare existing routes to the proposed map.
Then identify exact equivalences, gaps, conflicts, and safe next steps.

Proposed Sentinel API map:

Public product/status:
- GET /v1/status
- GET /v1/chains
- GET /v1/networks
- GET /v1/capabilities

Scan / explorer surface:
- GET /v1/scan/search?q=
- GET /v1/addresses/{chain}/{network}/{address}
- GET /v1/tokens/{chain}/{network}/{token_address}
- GET /v1/tokens/{chain}/{network}/{token_address}/holders
- GET /v1/tokens/{chain}/{network}/{token_address}/transfers
- GET /v1/transactions/{chain}/{network}/{tx_hash}

Price data:
- GET /v1/prices/assets
- GET /v1/prices/latest?asset=ETH&quote=USD
- GET /v1/prices/history?asset=ETH&quote=USD&from=&to=
- GET /v1/prices/at?asset=ETH&quote=USD&timestamp=

Infrastructure visibility:
- GET /v1/infra/status
- GET /v1/infra/routes
- GET /v1/infra/routes/{route_id}

NEAR / Nodo Sigiloso:
- GET /v1/near/validators
- GET /v1/near/validators/{account_id}
- GET /v1/near/validators/{account_id}/snapshots
- GET /v1/near/validators/{account_id}/status

Auth / customer usage:
- GET /v1/me
- GET /v1/me/api-keys
- GET /v1/me/usage
- GET /v1/me/rate-limits

Experimental / future:
- POST /v1/sentinel/query
- GET /v1/signals
- GET /v1/signals/{signal_id}

Expected equivalence direction:
- price-indexer internal QL maps to Sentinel `/v1/prices/*`
- infra-gateway / Bigwig operational state maps to Sentinel `/v1/infra/*`
- EVM event indexer maps to Sentinel `/v1/tokens/*`, `/v1/addresses/*`, and `/v1/transactions/*`
- near-validator-indexer maps to Sentinel `/v1/near/validators/*`
- Sentinel-owned auth/rate-limit state maps to `/v1/me/*`

Tasks:

1. Inspect the current repository.
   Look for:
   - route definitions
   - handlers/controllers
   - OpenAPI specs if present
   - tests
   - DTOs/types/schemas
   - database access modules
   - service clients
   - environment variables
   - README or docs mentioning endpoints

2. Produce a table with this shape:

   Existing route | Current purpose | Proposed equivalent | Status | Recommended action

   Status should be one of:
   - keep as-is
   - keep but rename
   - keep internal only
   - deprecate
   - missing
   - conflict
   - unclear

3. Identify public/internal boundary problems.
   Flag any route that exposes internal service names such as:
   - price-indexer
   - bigwig
   - infra-gateway
   - worker
   - indexer-worker
   - database/schema implementation details

4. Propose stable response envelopes.

   Prefer a consistent shape like:

   Success:
   {
     "data": ...,
     "meta": {
       "chain": "...",
       "network": "...",
       "source": "...",
       "indexed_at": "...",
       "partial": false
     }
   }

   Error:
   {
     "error": {
       "code": "...",
       "message": "...",
       "details": {}
     }
   }

   For alpha routes, include honest metadata:
   - partial
   - indexed_from_block
   - indexed_to_block
   - last_synced_at
   - source
   - stale

5. Identify which proposed endpoints are safe for Alpha 1.
   Classify each as:
   - Alpha 1 ready
   - Alpha 1 stub with honest “not indexed yet”
   - internal only
   - post-hackathon
   - should not exist yet

6. Do not expose raw RPC publicly unless already intentionally designed.
   If raw RPC exists or is planned, classify it separately as authenticated/beta and explain the risk.

7. Produce a minimal migration plan.
   The plan should avoid breaking current working routes before ETH Mexico.
   Prefer aliases, compatibility wrappers, and documentation before destructive renames.

8. Produce acceptance criteria.

   Example:
   - All public routes live under `/v1/*`.
   - No public route exposes internal service names.
   - Current working price/status endpoints have proposed `/v1/*` equivalents.
   - Legacy routes are either documented as internal, redirected, or marked deprecated.
   - Tests cover at least `/v1/status`, one `/v1/prices/*` route, one `/v1/infra/*` route, and one honest “not indexed yet” scan route.
   - Response envelopes are consistent.
   - Alpha routes disclose partial or stale data honestly.

Output format:

A. Summary of current state  
B. Existing-to-proposed endpoint equivalence table  
C. Public/internal boundary issues  
D. Proposed final `/v1/*` contract map for this repo  
E. Alpha 1 scope recommendation  
F. Migration plan  
G. Acceptance criteria  
H. Specific files that need edits  

Do not implement yet unless explicitly asked.
First return the evaluation and proposed plan.