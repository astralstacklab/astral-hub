#!/bin/bash

# ==============================================================================
# Card ERP Development Environment Setup Script
# ==============================================================================
#
# This script automates the setup of the local development environment.
#
# It performs the following actions:
#   1. Checks for required tools (pnpm, docker).
#   2. Creates a local .env file from the .env.example template.
#   3. Starts the required services (PostgreSQL, Redis) using Docker Compose.
#   4. Installs all project dependencies using pnpm.
#   5. (Optional) Sets up a local HTTPS environment using mkcert.
#
# Usage:
#   ./scripts/setup-dev.sh
#
# ==============================================================================

# --- Shell Colors for Logging ---
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_CYAN='\033[0;36m'
COLOR_RED='\033[0;31m'

log_info() {
    echo -e "${COLOR_CYAN}INFO: $1${COLOR_RESET}"
}

log_success() {
    echo -e "${COLOR_GREEN}SUCCESS: $1${COLOR_RESET}"
}

log_warn() {
    echo -e "${COLOR_YELLOW}WARN: $1${COLOR_RESET}"
}

log_error() {
    echo -e "${COLOR_RED}ERROR: $1${COLOR_RESET}"
}

# --- Stop script on any error ---
set -e

# --- 1. Check for required tools ---
log_info "Checking for required tools (node, pnpm, docker)..."

if ! command -v node &> /dev/null
then
    log_error "Node.js could not be found. Please install Node.js >= 18.0.0."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version must be >= 18.0.0. Current: $(node -v)"
    exit 1
fi

if ! command -v pnpm &> /dev/null
then
    log_error "pnpm could not be found. Please install pnpm >= 8.0.0 (e.g., npm install -g pnpm)."
    exit 1
fi

PNPM_VERSION=$(pnpm -v | cut -d. -f1)
if [ "$PNPM_VERSION" -lt 8 ]; then
    log_error "pnpm version must be >= 8.0.0. Current: $(pnpm -v)"
    exit 1
fi

if ! command -v docker &> /dev/null
then
    log_error "Docker could not be found. Please install and start Docker."
    exit 1
fi

log_success "All required tools are installed. (Node $(node -v), pnpm $(pnpm -v))"

# --- 2. Create .env file if it doesn't exist ---
log_info "Checking for .env file..."

if [ -f ".env" ]; then
    log_warn ".env file already exists. Skipping creation."
else
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_success ".env file created. Please review and fill in any necessary values."
fi

# --- 3. Start Docker services ---
log_info "Starting PostgreSQL and Redis services with Docker Compose..."
docker compose up -d
log_success "Docker services are up and running."

# --- 4. Install pnpm dependencies ---
log_info "Installing all project dependencies with pnpm..."
pnpm install
log_success "All dependencies are installed."

# --- 5. Optional: Setup local HTTPS with mkcert ---
# If you need local HTTPS, you can install mkcert (https://github.com/FiloSottile/mkcert)
# and uncomment the following lines.

# log_info "Checking for mkcert..."
# if ! command -v mkcert &> /dev/null
# then
#     log_warn "mkcert could not be found. Skipping local HTTPS setup."
# else
#     if [ -d ".cert" ]; then
#         log_warn "'.cert' directory already exists. Skipping certificate generation."
#     else
#         log_info "Generating local SSL certificate..."
#         mkdir -p .cert
#         mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "localhost" "127.0.0.1" "::1"
#         log_success "Local SSL certificate created in './.cert' directory."
#     fi
# fi

echo ""
log_success "Card ERP development environment setup is complete!"
log_info "You can now start developing in the respective workspaces."
log_info "For example, to start the API server: \`pnpm --filter api dev\`"

exit 0
