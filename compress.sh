#!/bin/bash

ZIP_NAME="JAMBTEST.zip"

echo ">>> Cleaning old zip if it exists..."
rm -f "$ZIP_NAME"

echo ">>> Compressing build folder, bundle.js, and package.json into $ZIP_NAME..."

zip -r "$ZIP_NAME" \
  dist/build \
  dist/bundle.js \
  package.json

echo ">>> Done!"
echo "Created: $ZIP_NAME"
