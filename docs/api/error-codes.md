# API 錯誤碼文檔

## 回應格式

### 成功回應

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人類可讀的錯誤訊息",
    "details": { ... }
  }
}
```

## 錯誤碼列表

| 錯誤碼           | HTTP 狀態碼 | 說明                         |
| ---------------- | ----------- | ---------------------------- |
| VALIDATION_ERROR | 400         | 請求參數驗證失敗（Zod 驗證） |
| BAD_REQUEST      | 400         | 一般性的請求錯誤             |
| UNAUTHORIZED     | 401         | 未授權（缺少或無效的 JWT）   |
| NOT_FOUND        | 404         | 路由或資源不存在             |
| RATE_LIMITED     | 429         | 請求頻率超過限制             |
| INTERNAL_ERROR   | 500         | 伺服器內部錯誤               |

## 驗證錯誤詳情

當錯誤碼為 `VALIDATION_ERROR` 時，`details` 會包含 Zod 驗證的錯誤詳情（僅限非生產環境）：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": {
      "issues": [
        {
          "code": "invalid_type",
          "path": ["name"],
          "message": "Expected string, received undefined"
        }
      ]
    }
  }
}
```

## 頻率限制

- 預設限制：每分鐘 100 次請求
- 超過限制時回傳 `429 RATE_LIMITED`
- 回應 Header 包含限制資訊：
  - `X-RateLimit-Limit`: 限制次數
  - `X-RateLimit-Remaining`: 剩餘次數
  - `X-RateLimit-Reset`: 重置時間
