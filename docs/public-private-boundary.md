# Public/Private Boundary

Sentinel is public. Bigwig, private indexers, RPC nodes, and internal gateways are not.

This repository must not expose:

- real RPC URLs
- production secrets
- private indexer schemas
- internal gateway routes
- raw Postgres inspection endpoints
- claims that partial demo data is complete

Mantle data should enter Sentinel through `MantleProvider`. Public responses should describe source, freshness, indexed block, confidence, partial coverage, and warnings.
