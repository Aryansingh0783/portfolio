@echo off
rem Local preview of the portfolio at http://localhost:4191  (close this window to stop it)
cd /d "%~dp0"
set PORT=4191
start "" http://localhost:4191
node server.mjs
