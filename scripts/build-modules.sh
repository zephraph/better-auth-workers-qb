#!/bin/bash
set -e

# Build all TypeScript modules to JavaScript
echo "Building TypeScript modules..."

# Create dist directory
mkdir -p dist

# Build main modules
echo "Building core modules..."
bun build src/index.ts --target bun --format esm > dist/index.js
bun build src/migrations.ts --target bun --format esm > dist/migrations.js
bun build src/schema-types.ts --target bun --format esm > dist/schema-types.js
bun build src/schema-processor.ts --target bun --format esm > dist/schema-processor.js
bun build src/sql-generator.ts --target bun --format esm > dist/sql-generator.js
bun build src/schema-converter.ts --target bun --format esm > dist/schema-converter.js
bun build src/utils.ts --target bun --format esm > dist/utils.js

echo "Fixing import paths..."
# Fix import paths in all built files
sed -i '' 's/"types\.ts"/"\.\/types\.js"/g; s/"utils\.ts"/"\.\/utils\.js"/g; s/"migrations\.ts"/"\.\/migrations\.js"/g; s/"schema-types\.ts"/"\.\/schema-types\.js"/g; s/"schema-processor\.ts"/"\.\/schema-processor\.js"/g; s/"sql-generator\.ts"/"\.\/sql-generator\.js"/g; s/"schema-converter\.ts"/"\.\/schema-converter\.js"/g' dist/index.js

sed -i '' 's/"schema-types\.ts"/"\.\/schema-types\.js"/g' dist/migrations.js dist/schema-processor.js dist/sql-generator.js dist/schema-converter.js

echo "TypeScript modules built successfully!"