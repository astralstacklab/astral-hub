#!/bin/bash
# Astral Hub - Claude Code Skills 安裝腳本
# 此腳本會安裝專案所需的 Claude Code plugins
# 執行方式: bash .claude/setup-skills.sh

set -e

echo "=== Astral Hub Claude Code Skills Setup ==="
echo ""

# 檢查 claude 命令是否存在
if ! command -v claude &> /dev/null; then
    echo "錯誤: 未找到 claude 命令。請先安裝 Claude Code CLI。"
    echo "安裝指南: https://docs.anthropic.com/claude-code"
    exit 1
fi

echo "正在安裝專案所需的 Claude Code plugins..."
echo ""

# 安裝 superpowers plugin（核心開發流程技能）
echo "[1/3] 安裝 superpowers@superpowers-marketplace..."
claude plugin install superpowers@superpowers-marketplace --scope project || {
    echo "警告: superpowers 安裝失敗，嘗試使用 user scope..."
    claude plugin install superpowers@superpowers-marketplace --scope user
}

# 安裝 document-skills plugin（文件處理技能）
echo ""
echo "[2/3] 安裝 document-skills@anthropic-agent-skills..."
claude plugin install document-skills@anthropic-agent-skills --scope project || {
    echo "警告: document-skills 安裝失敗，嘗試使用 user scope..."
    claude plugin install document-skills@anthropic-agent-skills --scope user
}

# 安裝 claude-reflect plugin（反思與學習技能）
echo ""
echo "[3/3] 安裝 claude-reflect@claude-reflect-marketplace..."
claude plugin install claude-reflect@claude-reflect-marketplace --scope project || {
    echo "警告: claude-reflect 安裝失敗，嘗試使用 user scope..."
    claude plugin install claude-reflect@claude-reflect-marketplace --scope user
}

echo ""
echo "=== 安裝完成 ==="
echo ""
echo "已安裝的 plugins:"
claude plugin list

echo ""
echo "核心 Skills 使用說明："
echo "  - superpowers:systematic-debugging    - Debug 問題時使用"
echo "  - superpowers:test-driven-development - TDD 開發流程"
echo "  - superpowers:verification-before-completion - 完成前驗證"
echo "  - superpowers:requesting-code-review  - 請求 Code Review"
echo "  - document-skills:frontend-design     - 前端 UI 設計"
echo ""
echo "詳細使用指南: docs/SKILLS_GUIDE.md"
