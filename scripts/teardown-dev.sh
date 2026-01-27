#!/bin/bash
set -e

DOWN_CMD="docker compose down"

read -p "是否要刪除 Docker volumes (postgres_data, redis_data)？這會刪除所有資料庫資料。[y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "設定為刪除 Docker volumes..."
  DOWN_CMD="docker compose down -v"
fi

echo "停止 Docker containers..."
$DOWN_CMD
echo "Docker containers 已停止。"

read -p "是否要刪除 node_modules？ [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "刪除 node_modules..."
  rm -rf node_modules
  echo "node_modules 已刪除。"
fi

echo -e "\n✅ 環境已清理完成。"
