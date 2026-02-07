# 開發環境疑難排解

## Docker 常見問題

### 容器啟動失敗

**症狀**: `docker compose up -d` 報錯或容器不斷重啟

**排查步驟**:

```bash
# 查看容器狀態
docker compose ps

# 查看容器日誌
docker compose logs postgres
docker compose logs redis
```

**常見原因**:

- Docker 未啟動 → 啟動 Docker Desktop 或 Docker Engine
- 舊容器殘留 → `docker compose down -v` 清除後重新啟動
- 映像損壞 → `docker compose pull` 重新拉取

### 資料庫資料重置

```bash
# 停止容器並刪除 volumes（資料會全部清除）
docker compose down -v

# 重新啟動
docker compose up -d
```

---

## 端口衝突

### PostgreSQL 端口 5678 被佔用

**症狀**: `Error: bind: address already in use`

**排查**:

```bash
# 查看佔用端口的程序
lsof -i :5678
# 或
netstat -tlnp | grep 5678
```

**解決方案**:

1. 終止佔用端口的程序
2. 或修改 `docker-compose.yml` 和 `.env` 中的端口映射

**背景**: 本專案使用 5678 而非預設 5432，因為 WSL2 環境下 Hyper-V 會保留 5432 端口。

### Redis 端口 6379 被佔用

**排查與解決方式同上**，替換端口號即可。

---

## 環境變數問題

### 驗證失敗

**症狀**: `pnpm run validate-env` 報錯

**常見原因**:

- `.env` 檔案不存在 → `cp .env.example .env`
- 必要變數缺失或格式錯誤 → 根據錯誤訊息修正對應變數
- `DATABASE_URL` 格式必須為 `postgresql://` 開頭
- `REDIS_URL` 格式必須為 `redis://` 開頭
- `JWT_SECRET` 長度至少 16 字元

---

## Node.js / pnpm 問題

### pnpm install 失敗

**排查**:

```bash
# 確認版本
node -v   # 需 >= 18.0.0
pnpm -v   # 需 >= 8.0.0

# 清除快取後重試
pnpm store prune
rm -rf node_modules
pnpm install
```

### 權限問題（Linux/macOS）

**症狀**: `Permission denied` 執行腳本時

**解決**:

```bash
chmod +x scripts/setup-dev.sh
chmod +x scripts/teardown-dev.sh
```

---

## Git Hooks 問題

### pre-commit hook 不執行

**排查**:

```bash
# 確認 husky 已初始化
ls -la .husky/pre-commit

# 重新初始化
pnpm exec husky init
```

### commitlint 攔截 commit

**症狀**: commit 被拒絕，顯示 `type-empty` 或 `subject-empty`

**原因**: commit message 不符合 Conventional Commits 格式

**正確格式**:

```
<type>(<scope>): <subject>

# 範例
feat(products): 新增商品搜尋功能
fix(auth): 修正 JWT 過期處理
docs: 更新 README
```

**允許的 type**: feat、fix、docs、style、refactor、perf、test、chore

### 跳過 hooks（緊急情況）

```bash
git commit --no-verify -m "feat: emergency fix"
```

> 僅限緊急情況使用，正常開發應遵循 hooks 規範。
