# Astral Hub 資料庫遷移指南

## 概述

本專案使用 Prisma Migrate 管理資料庫版本。遷移檔案位於 `services/api/prisma/migrations/`。

---

## 常用指令

所有指令需在 `services/api/` 目錄下執行。

### 開發環境

```bash
# 建立新遷移（修改 schema.prisma 後執行）
pnpm run db:migrate

# 重新生成 Prisma Client（schema 變更後）
pnpm run db:generate

# 執行 seed 填充測試資料
pnpm run db:seed

# 重置資料庫（刪除所有資料 + 重新遷移 + seed）
pnpm run db:reset

# 驗證 schema 語法
pnpm run db:validate

# 格式化 schema 檔案
pnpm run db:format

# 開啟 Prisma Studio（GUI 瀏覽資料）
pnpm run db:studio
```

### 生產環境

```bash
# 部署遷移（不會重新生成 client）
pnpm run db:migrate:deploy
```

---

## 工作流程

### 新增或修改資料表

1. 編輯 `prisma/schema.prisma`
2. 驗證語法：`pnpm run db:validate`
3. 建立遷移：`pnpm run db:migrate`
   - Prisma 會提示輸入遷移名稱（例如 `add_coupon_table`）
   - 自動產生 SQL 遷移檔案
   - 自動套用到開發資料庫
   - 自動重新生成 Prisma Client
4. 確認遷移成功，將遷移檔案提交到版本控制

### 生產環境部署

1. 確保所有遷移檔案已提交到版本控制
2. 在生產環境執行：`pnpm run db:migrate:deploy`
   - 只會套用尚未執行的遷移
   - **不會**建立新遷移
   - **不會**重新生成 Client

### 重置開發資料庫

```bash
pnpm run db:reset
```

這會：

1. 刪除資料庫中所有資料表
2. 按順序重新套用所有遷移
3. 執行 seed 腳本填充測試資料

> **注意**：此指令會清除所有資料，僅限開發環境使用。

---

## 遷移檔案結構

```
prisma/migrations/
├── 20260214083450_init/    ← 初始遷移
│   └── migration.sql       ← SQL DDL 語句
└── migration_lock.toml      ← 資料庫類型鎖定（postgresql）
```

- 每次遷移會產生一個以時間戳命名的目錄
- 目錄內的 `migration.sql` 包含實際的 SQL 變更
- `migration_lock.toml` 確保遷移只能用於指定的資料庫類型
- **不要手動修改已套用的遷移檔案**

---

## 注意事項

1. **遷移檔案必須進版控**：遷移檔案是資料庫 schema 的歷史記錄，必須提交到 Git
2. **不要修改已套用的遷移**：已套用的遷移會記錄在 `_prisma_migrations` 資料表，修改會導致不一致
3. **生產環境只用 `migrate deploy`**：開發用的 `migrate dev` 會嘗試重置資料，生產環境絕對不可使用
4. **破壞性變更需謹慎**：刪除欄位、刪除表、更名等操作可能導致資料遺失，執行前務必備份
5. **環境變數**：確保 `.env` 中的 `DATABASE_URL` 正確設定

---

## 疑難排解

### 遷移衝突

如果多人同時建立遷移導致衝突：

```bash
# 重置遷移歷史（僅限開發環境）
pnpm run db:reset
```

### Schema 與資料庫不同步

```bash
# 檢查目前 schema 與資料庫的差異
pnpm exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
```

### Prisma Client 過期

如果程式碼中的型別與 schema 不符：

```bash
pnpm run db:generate
```
