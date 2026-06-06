import { notIndexedMeta, sentinelMeta } from "./responses.js";
import type { ServiceError } from "./token-service.js";

export function getInfraStatus() {
  return {
    data: {
      status: "stub",
      raw_rpc_public: false,
      internal_gateway_public: false,
      message: "Infrastructure visibility is reserved for safe public metadata in Sentinel Alpha 1."
    },
    meta: sentinelMeta({ source: "sentinel-infra-service", partial: true })
  };
}

export function getInfraRoutes() {
  return {
    data: [],
    meta: sentinelMeta({
      source: "sentinel-infra-service",
      partial: true,
      routes_indexed: false
    })
  };
}

export function getInfraRoute(routeId: string): ServiceError {
  return {
    ok: false,
    status: 501,
    code: "NOT_CONNECTED_YET",
    message: "Route-level infrastructure telemetry is not connected in Sentinel Alpha 1.",
    details: { route_id: routeId },
    meta: notIndexedMeta({ source: "sentinel-infra-service" })
  };
}

