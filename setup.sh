#!/bin/bash

# Repository Analyzer Setup Script
set -e

echo "🔧 Setting up Repository Analyzer..."

# Check if Python 3 is installed and version
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c "import sys; print('.'.join(map(str, sys.version_info[:2])))")
REQUIRED_VERSION="3.8"
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo "✅ Python $PYTHON_VERSION detected (>= $REQUIRED_VERSION required)"
else
    echo "❌ Error: Python $PYTHON_VERSION detected. Python $REQUIRED_VERSION or higher is required."
    echo "Please upgrade Python or use a newer version."
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

# Upgrade pip first to avoid compatibility issues
echo "⬆️ Upgrading pip..."
python3 -m pip install --upgrade pip

# Install dependencies with better error handling
echo "📥 Installing dependencies..."

# Function to try alternative installation methods
install_with_alternatives() {
    local package=$1
    echo "Installing: $package"
    
    # Try pip with different options
    if pip install "$package"; then
        return 0
    elif pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org "$package"; then
        echo "✅ Installed $package with trusted hosts"
        return 0
    elif pip install --user "$package"; then
        echo "✅ Installed $package in user directory"
        return 0
    else
        echo "❌ Failed to install $package via pip"
        
        # Try homebrew alternatives for common packages
        case $package in
            *PyYAML* | *pyyaml*)
                if command -v brew &> /dev/null && brew install libyaml && pip install PyYAML; then
                    echo "✅ Installed PyYAML with homebrew libyaml"
                    return 0
                fi
                ;;
        esac
        
        echo "❌ All installation methods failed for $package"
        return 1
    fi
}

# Try installing all requirements first
if ! pip install -r requirements.txt; then
    echo "❌ Failed to install requirements from requirements.txt"
    echo "Trying alternative installation methods..."
    
    # Try with trusted hosts
    if pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt; then
        echo "✅ Installed requirements with trusted hosts"
    else
        echo "Trying to install dependencies individually..."
        
        # Try installing each dependency individually with alternatives
        while read -r requirement; do
            if [[ $requirement == \#* ]] || [[ -z "$requirement" ]]; then
                continue
            fi
            install_with_alternatives "$requirement"
        done < requirements.txt
    fi
fi

echo "📦 Installing package in development mode..."
if ! pip install -e .; then
    echo "❌ Failed to install package in development mode"
    echo "Trying alternative installation method..."
    pip install .
fi

echo "✅ Setup complete!"
echo ""
echo "To use the analyzer:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run: python3 run.py scan /path/to/repository --output analysis.md"
echo "  Or use the convenience script: python3 analyze.py /path/to/repository"
echo ""
echo "If you encounter issues, try:"
echo "  - Ensure you have a stable internet connection"
echo "  - Update your Python installation"
echo "  - Run: python3 -m pip install --upgrade pip setuptools wheel"