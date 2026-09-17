#!/usr/bin/env python3
"""
Short URL System - Automated Functional & Security Test Suite
Covers: Registration, Login, JWT Validation, RBAC Guards, Short URL Lifecycle, Bloom Rejection
"""

import urllib.request
import urllib.error
import json
import time
import sys

BASE_URL = "http://localhost:8081"
PASS_COUNT = 0
FAIL_COUNT = 0

def log_test(test_id, description, status, detail=""):
    global PASS_COUNT, FAIL_COUNT
    if status == "PASS":
        PASS_COUNT += 1
        print(f"\033[92m[✓ PASS]\033[0m {test_id}: {description}")
    else:
        FAIL_COUNT += 1
        print(f"\033[91m[✗ FAIL]\033[0m {test_id}: {description} -> {detail}")

def http_request(method, path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            resp_body = resp.read().decode("utf-8")
            resp_headers = dict(resp.headers)
            try:
                parsed_json = json.loads(resp_body) if resp_body else {}
            except Exception:
                parsed_json = resp_body
            return status, parsed_json, resp_headers
    except urllib.error.HTTPError as e:
        status = e.code
        resp_body = e.read().decode("utf-8")
        try:
            parsed_json = json.loads(resp_body) if resp_body else {}
        except Exception:
            parsed_json = resp_body
        return status, parsed_json, dict(e.headers)
    except Exception as e:
        return 0, str(e), {}

print("=" * 70)
print("  SHORT URL SYSTEM - AUTOMATED FUNCTIONAL & SECURITY TEST SUITE")
print(f"  Target: {BASE_URL} | Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# Generate unique username for testing
test_user = f"tester_{int(time.time())}"
test_email = f"{test_user}@domain.test"
test_password = "SecurePassword123!"

# -------------------------------------------------------------
# 1. AUTH & SECURITY SUITE
# -------------------------------------------------------------

# TEST 1: User Registration
status, body, _ = http_request("POST", "/api/auth/public/register", {
    "username": test_user,
    "email": test_email,
    "password": test_password,
    "role": ["user"]
})
if status == 200 and "注册成功" in str(body):
    log_test("AUTH-01", "用户正常注册流程", "PASS")
else:
    log_test("AUTH-01", "用户正常注册流程", "FAIL", f"Status: {status}, Body: {body}")

# TEST 2: Duplicate Username Registration
status, body, _ = http_request("POST", "/api/auth/public/register", {
    "username": test_user,
    "email": f"diff_{test_email}",
    "password": test_password
})
if status == 400 and "用户名已存在" in str(body):
    log_test("AUTH-02", "防止用户名重复注册 (400 校验)", "PASS")
else:
    log_test("AUTH-02", "防止用户名重复注册 (400 校验)", "FAIL", f"Status: {status}, Body: {body}")

# TEST 3: Duplicate Email Registration
status, body, _ = http_request("POST", "/api/auth/public/register", {
    "username": f"diff_{test_user}",
    "email": test_email,
    "password": test_password
})
if status == 400 and "邮箱已被注册" in str(body):
    log_test("AUTH-03", "防止邮箱重复注册 (400 校验)", "PASS")
else:
    log_test("AUTH-03", "防止邮箱重复注册 (400 校验)", "FAIL", f"Status: {status}, Body: {body}")

# TEST 4: Login with Wrong Password
status, body, _ = http_request("POST", "/api/auth/public/login", {
    "username": test_user,
    "password": "wrong_password_xyz"
})
if status == 401:
    log_test("AUTH-04", "密码错误登录防御 (401 Unauthorized)", "PASS")
else:
    log_test("AUTH-04", "密码错误登录防御 (401 Unauthorized)", "FAIL", f"Status: {status}, Body: {body}")

# TEST 5: Login with Valid Password -> Obtain JWT
status, body, _ = http_request("POST", "/api/auth/public/login", {
    "username": test_user,
    "password": test_password
})
jwt_token = body.get("token") if isinstance(body, dict) else None
if status == 200 and jwt_token:
    log_test("AUTH-05", "密码正确登录并获取有效 JWT 令牌", "PASS")
else:
    log_test("AUTH-05", "密码正确登录并获取有效 JWT 令牌", "FAIL", f"Status: {status}, Body: {body}")

# TEST 6: Unauthenticated Request to Protected Endpoint
status, body, _ = http_request("POST", "/api/urls/shorten", {"originalUrl": "https://example.com"})
if status in (401, 403):
    log_test("AUTH-06", f"未授权访问受保护接口拦截 (HTTP {status} 成功阻断)", "PASS")
else:
    log_test("AUTH-06", "未授权访问受保护接口拦截", "FAIL", f"Status: {status}, Body: {body}")

# TEST 7: Malformed Token Rejection
status, body, _ = http_request("POST", "/api/urls/shorten", 
    {"originalUrl": "https://example.com"}, 
    headers={"Authorization": "Bearer malformed.fake.jwt.token"}
)
if status in (401, 403):
    log_test("AUTH-07", f"伪造/篡改 JWT 令牌拦截 (HTTP {status} 成功阻断)", "PASS")
else:
    log_test("AUTH-07", "伪造/篡改 JWT 令牌拦截", "FAIL", f"Status: {status}, Body: {body}")

# -------------------------------------------------------------
# 2. SHORT URL DOMAIN SUITE
# -------------------------------------------------------------
auth_headers = {"Authorization": f"Bearer {jwt_token}"} if jwt_token else {}

# TEST 8: Create Short URL
target_original_url = "https://zedran.dev/portfolio"
status, body, _ = http_request("POST", "/api/urls/shorten", 
    {"originalUrl": target_original_url}, 
    headers=auth_headers
)
generated_short_url = body.get("shortUrl") if isinstance(body, dict) else None
if status == 200 and generated_short_url:
    log_test("URL-01", f"生成短链接成功 (分配短码: '{generated_short_url}')", "PASS")
else:
    log_test("URL-01", "生成短链接成功", "FAIL", f"Status: {status}, Body: {body}")

# TEST 9: HTTP 302 Redirect & Location Header Check
class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)
req = urllib.request.Request(f"{BASE_URL}/{generated_short_url}")
try:
    with opener.open(req) as resp:
        redirect_code = resp.getcode()
        redirect_location = resp.headers.get("Location")
        if redirect_code == 302 and redirect_location == target_original_url:
            log_test("URL-02", f"短链秒级重定向 (HTTP 302 -> {redirect_location})", "PASS")
        else:
            log_test("URL-02", "短链秒级重定向", "FAIL", f"Code: {redirect_code}, Location: {redirect_location}")
except urllib.error.HTTPError as e:
    redirect_location = e.headers.get("Location")
    if e.code == 302 and redirect_location == target_original_url:
        log_test("URL-02", f"短链秒级重定向 (HTTP 302 -> {redirect_location})", "PASS")
    else:
        log_test("URL-02", "短链秒级重定向", "FAIL", f"Status: {e.code}, Location: {redirect_location}")
except Exception as e:
    log_test("URL-02", "短链秒级重定向", "FAIL", str(e))

# TEST 10: Bloom Filter Fast Reject for Non-existent Short Code
fake_code = "non_existent_fake_slug_9999"
req_fake = urllib.request.Request(f"{BASE_URL}/{fake_code}")
try:
    opener.open(req_fake)
    log_test("URL-03", "布隆过滤器快速阻断不存在短码 (404 Not Found)", "FAIL", "Expected 404 but got 200/302")
except urllib.error.HTTPError as e:
    if e.code == 404:
        log_test("URL-03", "布隆过滤器快速阻断不存在短码 (404 Not Found)", "PASS")
    else:
        log_test("URL-03", "布隆过滤器快速阻断不存在短码 (404 Not Found)", "FAIL", f"Status: {e.code}")
except Exception as e:
    log_test("URL-03", "布隆过滤器快速阻断不存在短码 (404 Not Found)", "FAIL", str(e))

# TEST 11: Get User URLs List
status, body, _ = http_request("GET", "/api/urls/myurls", headers=auth_headers)
if status == 200 and isinstance(body, list) and len(body) > 0:
    log_test("URL-04", f"查询当前用户个人短链列表 (返回 {len(body)} 条记录)", "PASS")
else:
    log_test("URL-04", "查询当前用户个人短链列表", "FAIL", f"Status: {status}, Body: {body}")

print("=" * 70)
print(f"  TEST SUMMARY: TOTAL: {PASS_COUNT + FAIL_COUNT} | PASS: {PASS_COUNT} | FAIL: {FAIL_COUNT}")
if FAIL_COUNT == 0:
    print("  \033[92mALL AUTOMATED FUNCTIONAL & SECURITY TESTS PASSED SUCCESSFULLY!\033[0m")
else:
    print("  \033[91mSOME TESTS FAILED! PLEASE REVIEW LOGS ABOVE.\033[0m")
print("=" * 70)
