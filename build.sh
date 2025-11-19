#!/bin/bash

# build.sh
echo "Running build..."
npm run prod:bundle


echo "Staging changes..."
git add .

echo "Committing changes..."
git commit -m "$1"

echo "Pushing to remote..."
git push origin master

 


echo "✅ Build, and Git push completed."