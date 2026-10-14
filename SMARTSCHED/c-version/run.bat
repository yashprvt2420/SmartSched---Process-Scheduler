@echo off
gcc smartsched.c -o smartsched.exe
if %errorlevel% neq 0 (
    pause
    exit /b %errorlevel%
)

smartsched.exe
pause
