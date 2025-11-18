#!/bin/bash

ZIP_NAME="JAMBTEST.zip"

echo ">>> Cleaning old zip if it exists..."
rm -f $ZIP_NAME

echo ">>> Compressing dist and package.json into $ZIP_NAME..."

zip -r $ZIP_NAME dist package.json

echo ">>> Done!"
echo "Created: $ZIP_NAME"
