@echo off
setlocal
cd /d D:\workbuddy\2026-08-05-01-04-07\flowos-fresh\apps\web

:: 1. 启用 export
D:\codex\node.exe -e "const fs=require('fs');let c=fs.readFileSync('next.config.js','utf8');if(!c.includes('output:'))c=c.replace('transpilePackages:','output: ''export'','+String.fromCharCode(10)+'  transpilePackages:');fs.writeFileSync('next.config.js',c);"

:: 2. 构建
D:\codex\node.exe ..\..\node_modules\next\dist\bin\next build
if %errorlevel% neq 0 goto end

:: 3. 关闭 export
D:\codex\node.exe -e "const fs=require('fs');let c=fs.readFileSync('next.config.js','utf8');c=c.replace(/output: 'export',\n  /,'');fs.writeFileSync('next.config.js',c);"

:: 4. 推 GitHub Pages
cd out
git add -A
git commit -m "deploy" --allow-empty
git push -f origin gh-pages

:end
echo Done.
pause