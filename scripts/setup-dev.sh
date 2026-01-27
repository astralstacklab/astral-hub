#!/bin/bash
set -e

# 檢查 Node.js 版本 (>=18)
echo "檢查 Node.js 版本..."
NODE_MAJOR_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
  echo "錯誤：需要 Node.js v18 或更高版本。目前版本為 $(node -v)"
  exit 1
fi
echo "Node.js 版本符合需求 ($(node -v))"

# 檢查 pnpm 版本 (>=8)
echo "檢查 pnpm 版本..."
PNPM_MAJOR_VERSION=$(pnpm -v | cut -d. -f1)
if [ "$PNPM_MAJOR_VERSION" -lt 8 ]; then
  echo "錯誤：需要 pnpm v8 或更高版本。目前版本為 $(pnpm -v)"
  exit 1
fi
echo "pnpm 版本符合需求 ($(pnpm -v))"

# 檢查 Docker 是否運行
echo "檢查 Docker 是否運行..."
if ! docker info >/dev/null 2>&1; then
  echo "錯誤：Docker 未在運行。請啟動 Docker Desktop。"
  exit 1
fi
echo "Docker 正在運行。"

# 複製 .env.example → .env（如果不存在）
if [ ! -f ".env" ]; then
  echo "建立 .env 檔案..."
  cp .env.example .env
  echo ".env 檔案已建立。請根據需求修改。"
else
  echo ".env 檔案已存在。"
fi

# 啟動 Docker containers
echo "啟動 Docker containers (PostgreSQL and Redis)..."
docker compose up -d

# 安裝所有依賴
echo "安裝 pnpm 依賴..."
pnpm install

echo -e "\n✅ 開發環境設定完成！"
echo "下一步："
echo "1. (若有需要) 修改 .env 檔案中的設定"
echo "2. 執行 'pnpm --filter api dev' 來啟動後端 API 伺服器"
