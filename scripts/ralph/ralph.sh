#!/bin/bash

# Ralph Loop - Autonomous Implementation Agent
# Usage: ./ralph.sh [max_iterations]
# Default: 50 iterations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"

# Configuration
MAX_ITERATIONS=${1:-50}
COMPLETE_MARKER="<promise>COMPLETE</promise>"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_iteration() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}[ITERATION $1/$MAX_ITERATIONS]${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if [ ! -f "$PROMPT_FILE" ]; then
        log_error "prompt.md not found at $PROMPT_FILE"
        log_info "Run /setup-ralph first to generate the required files."
        exit 1
    fi

    if [ ! -f "$PRD_FILE" ]; then
        log_error "prd.json not found at $PRD_FILE"
        log_info "Run /setup-ralph first to generate the required files."
        exit 1
    fi

    if [ ! -f "$PROGRESS_FILE" ]; then
        log_error "progress.txt not found at $PROGRESS_FILE"
        log_info "Run /setup-ralph first to generate the required files."
        exit 1
    fi

    # Check if claude is available
    if ! command -v claude &> /dev/null; then
        log_error "Claude CLI not found. Please install it first."
        exit 1
    fi

    log_success "All prerequisites met."
}

# Get current story stats
get_story_stats() {
    local total=$(jq '.userStories | length' "$PRD_FILE")
    local completed=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
    local remaining=$((total - completed))
    echo "$completed/$total stories completed ($remaining remaining)"
}

# Check if all stories are complete
all_stories_complete() {
    local remaining=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE")
    [ "$remaining" -eq 0 ]
}

# Main loop
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    RALPH LOOP - Starting                      ║"
    echo "║              Autonomous Implementation Agent                  ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prerequisites

    log_info "Max iterations: $MAX_ITERATIONS"
    log_info "Story status: $(get_story_stats)"

    # Read prompt content
    PROMPT_CONTENT=$(cat "$PROMPT_FILE")

    for ((i=1; i<=MAX_ITERATIONS; i++)); do
        log_iteration $i

        # Check if all stories are already complete
        if all_stories_complete; then
            log_success "All stories are already complete!"
            break
        fi

        log_info "Story status: $(get_story_stats)"
        log_info "Launching Claude Code agent..."

        # Create a temporary file for output
        OUTPUT_FILE=$(mktemp)

        # Run Claude with the prompt and capture output
        # Using --print to get the response and --dangerously-skip-permissions for automation
        if claude --print --dangerously-skip-permissions "$PROMPT_CONTENT" 2>&1 | tee "$OUTPUT_FILE"; then
            # Check if output contains COMPLETE marker
            if grep -q "$COMPLETE_MARKER" "$OUTPUT_FILE"; then
                log_success "Agent signaled COMPLETE!"
                rm -f "$OUTPUT_FILE"
                break
            fi
        else
            log_warning "Claude exited with non-zero status. Continuing..."
        fi

        rm -f "$OUTPUT_FILE"

        # Small delay between iterations
        sleep 2

        log_info "Iteration $i completed."
    done

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    RALPH LOOP - Finished                      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    log_info "Final status: $(get_story_stats)"

    # Show recent commits
    log_info "Recent commits:"
    git log --oneline -5 2>/dev/null || true
}

# Run main
main
