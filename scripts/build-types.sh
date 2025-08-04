#!/bin/bash
set -e

echo "Building TypeScript declarations..."
tsc --declaration --emitDeclarationOnly

echo "TypeScript declarations built successfully!"