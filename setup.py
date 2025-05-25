from setuptools import setup, find_packages

setup(
    name="repo-analyzer",
    version="0.1.0",
    description="A tool that scans code repositories and generates documentation for Claude Projects",
    author="Your Name",
    author_email="your.email@example.com",
    url="https://github.com/yourusername/repo-analyzer",
    packages=["src"] + [f"src.{pkg}" for pkg in find_packages(where="src")],
    package_dir={"": "."},
    include_package_data=True,
    install_requires=[
        "click>=8.0.0",
        "GitPython>=3.1.0",
        "tree-sitter>=0.20.0",
        "pathspec>=0.9.0",
        "Pygments>=2.10.0",
        "markdown>=3.3.0",
        "PyYAML>=6.0.0",
        "rich>=12.0.0",
    ],
    entry_points={
        "console_scripts": [
            "repo-analyzer=src.main:cli",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.7",
)