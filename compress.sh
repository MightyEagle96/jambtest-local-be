#!/bin/bash

ZIP_NAME="JAMBTEST.zip"

echo ">>> Cleaning old zip if it exists..."
rm -f $ZIP_NAME

echo ">>> Compressing dist, node_modules and package.json into $ZIP_NAME..."

zip -r $ZIP_NAME dist node_modules package.json

echo ">>> Done!"
echo "Created: $ZIP_NAME"
