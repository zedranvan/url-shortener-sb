#!/usr/bin/env python3
"""
Automated Multi-Scenario Performance Benchmark Runner
Executes ApacheBench across multiple concurrency levels (c=20, c=50, c=100)
Extracts QPS, Mean Latency, P50, P90, P99, and outputs markdown tables.
"""

import subprocess
import re
import json
import os
import sys

TARGET_HOST = "http://localhost:8081"
TOTAL_REQUESTS = 3000
CONCURRENCIES = [20, 50, 100]

def get_token():
    # Login as Coco to get token
    login_cmd = [
        "curl", "-s", "-X", "POST", f"{TARGET_HOST}/api/auth/public/login",
        "-H", "Content-Type: application/json",
        "-d", '{"username":"Coco","password":"cococisme123"}'
    ]
    res = subprocess.run(login_cmd, capture_output=True, text=True)
    try:
        data = json.loads(res.stdout)
        return data.get("token")
    except Exception:
        return ""

def run_ab(path, concurrency, requests=TOTAL_REQUESTS, headers=None):
    cmd = ["ab", "-n", str(requests), "-c", str(concurrency)]
    if headers:
        for h in headers:
            cmd.extend(["-H", h])
    cmd.append(f"{TARGET_HOST}{path}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    out = result.stdout
    
    # Parse metrics
    qps_match = re.search(r"Requests per second:\s+([\d\.]+)", out)
    mean_lat_match = re.search(r"Time per request:\s+([\d\.]+)\s+\[ms\]\s+\(mean\)", out)
    p50_match = re.search(r"50%\s+(\d+)", out)
    p90_match = re.search(r"90%\s+(\d+)", out)
    p95_match = re.search(r"95%\s+(\d+)", out)
    p99_match = re.search(r"99%\s+(\d+)", out)
    failed_match = re.search(r"Failed requests:\s+(\d+)", out)
    
    return {
        "concurrency": concurrency,
        "qps": float(qps_match.group(1)) if qps_match else 0.0,
        "mean_latency": float(mean_lat_match.group(1)) if mean_lat_match else 0.0,
        "p50": int(p50_match.group(1)) if p50_match else 0,
        "p90": int(p90_match.group(1)) if p90_match else 0,
        "p95": int(p95_match.group(1)) if p95_match else 0,
        "p99": int(p99_match.group(1)) if p99_match else 0,
        "failed": int(failed_match.group(1)) if failed_match else 0
    }

print("=" * 75)
print("  SHORT URL SYSTEM - SYSTEMATIC BENCHMARK SUITE")
print("  Executing comparative performance benchmarks via ApacheBench (ab)...")
print("=" * 75)

jwt_token = get_token()
auth_header = [f"Authorization: Bearer {jwt_token}"] if jwt_token else []

scenarios = [
    {
        "id": "SCENARIO_1_REDIS_CACHE",
        "name": "Redis 缓存命中重定向 (GET /6)",
        "path": "/6",
        "headers": []
    },
    {
        "id": "SCENARIO_2_BLOOM_FILTER",
        "name": "布隆过滤器防穿透秒拒 (GET /fake999999)",
        "path": "/fake999999",
        "headers": []
    },
    {
        "id": "SCENARIO_3_DB_AUTH_QUERY",
        "name": "PostgreSQL 鉴权+多表直连查询 (GET /api/urls/myurls)",
        "path": "/api/urls/myurls",
        "headers": auth_header
    }
]

benchmark_results = {}

for sc in scenarios:
    print(f"\n▶ 正在运行压测场景: {sc['name']} ...")
    scenario_metrics = []
    for c in CONCURRENCIES:
        print(f"  --> 并发数: {c} (总请求数: {TOTAL_REQUESTS}) ...", end="", flush=True)
        metrics = run_ab(sc['path'], c, TOTAL_REQUESTS, sc['headers'])
        scenario_metrics.append(metrics)
        print(f" [完成] QPS: {metrics['qps']:.1f} | Mean Latency: {metrics['mean_latency']:.2f}ms | P99: {metrics['p99']}ms")
    benchmark_results[sc['id']] = {
        "name": sc['name'],
        "metrics": scenario_metrics
    }

# Save structured JSON
with open("/home/zedran/短链/usl-shortener-sb/test-suite/benchmark_data.json", "w") as f:
    json.dump(benchmark_results, f, indent=2)

print("\n" + "=" * 75)
print("  BENCHMARK COMPLETED! All raw metrics recorded.")
print("=" * 75)
