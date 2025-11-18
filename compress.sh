#!/bin/bash

ZIP_NAME="JAMBTEST.zip"

echo ">>> Cleaning old zip if it exists..."
rm -f "$ZIP_NAME"

echo ">>> Compressing bundle.js and package.json into $ZIP_NAME..."

zip -j "$ZIP_NAME" dist/bundle.js package.json

echo ">>> Done!"
echo "Created: $ZIP_NAME"
