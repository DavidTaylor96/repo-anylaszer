#!/bin/bash

# Repository Analyzer Setup Script
set -e

echo "🔧 Setting up Repository Analyzer..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "📦 Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies and package in development mode
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo "📦 Installing package in development mode..."
pip install -e .

echo "✅ Setup complete!"
echo ""
echo "To use the analyzer:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run: python3 run.py scan /path/to/repository --output analysis.md"
echo "  Or use the convenience script: python3 analyze.py /path/to/repository"