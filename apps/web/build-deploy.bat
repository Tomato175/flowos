@echo off
chcp 65001 >nul
echo ============================================
echo   Build + Deploy FlowOS to GitHub Pages
echo ============================================
cd /d "%~dp0"

REM 1. clean
echo [1/4] Cleaning...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM 2. build
echo [2/4] Building (8GB heap)...
set NODE_OPTIONS=--max-old-space-size=8192
call "D:\codex\node.exe" "..\..\node_modules\next\dist\bin\next" build
if errorlevel 1 (
    echo BUILD FAILED
    pause
    exit /b 1
)
echo BUILD OK

REM 3. add .nojekyll
echo [3/4] Adding .nojekyll...
type nul > out\.nojekyll

REM 4. push
echo [4/4] Pushing to GitHub Pages...
cd out
call "C:\Users\Administrator\.workbuddy\vendor\PortableGit\mingw64\bin\git.exe" add -A
call "C:\Users\Administrator\.workbuddy\vendor\PortableGit\mingw64\bin\git.exe" commit -m "deploy latest"
call "C:\Users\Administrator\.workbuddy\vendor\PortableGit\mingw64\bin\git.exe" push -f origin gh-pages
cd ..

echo ============================================
echo   DONE!
echo   Open: https://tomato175.github.io/flowos/
echo ============================================
pause