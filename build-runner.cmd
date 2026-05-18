@echo off
cd /d "%~dp0"
pnpm exec electron-builder --win --x64 --publish never --config.icon=resources/icons/app.ico > build-output3.log 2>&1
