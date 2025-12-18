@echo off
echo Cleaning Next.js cache and build files...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleaned successfully!









