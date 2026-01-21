@echo off
chcp 65001 >nul
echo ========================================
echo   AdaSoft Deploy Tool - Git Auto Fix
echo ========================================
echo.

REM ตรวจสอบว่ารันด้วย Admin หรือไม่
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] กรุณารันไฟล์นี้ด้วยสิทธิ์ Administrator
    echo [!] คลิกขวาที่ไฟล์ แล้วเลือก "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/5] ตรวจสอบ Git Installation...
echo.

REM ตรวจสอบว่า Git ติดตั้งแล้วหรือยัง
git --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [✓] Git ติดตั้งแล้ว
    for /f "tokens=*" %%i in ('git --version') do echo     %%i
    echo.
    goto :check_path
) else (
    echo [✗] Git ยังไม่ได้ติดตั้ง
    echo.
    goto :install_git
)

:install_git
echo [!] ต้องติดตั้ง Git ก่อนใช้งาน Deploy Tool
echo.
echo กรุณาทำตามขั้นตอนนี้:
echo 1. เปิดเว็บ: https://git-scm.com/download/win
echo 2. ดาวน์โหลด "64-bit Git for Windows Setup"
echo 3. ติดตั้งโดยเลือก "Git from the command line and also from 3rd-party software"
echo 4. รันไฟล์นี้อีกครั้งหลังติดตั้งเสร็จ
echo.
echo [?] ต้องการเปิดหน้าดาวน์โหลดเลยหรือไม่? (Y/N)
set /p open_browser="> "
if /i "%open_browser%"=="Y" (
    start https://git-scm.com/download/win
)
echo.
pause
exit /b 1

:check_path
echo [2/5] ตรวจสอบ Git PATH...
echo.

REM ตรวจสอบว่า Git อยู่ใน PATH หรือไม่
where git >nul 2>&1
if %errorLevel% equ 0 (
    echo [✓] Git อยู่ใน System PATH
    for /f "tokens=*" %%i in ('where git') do echo     %%i
    echo.
    goto :check_apache
) else (
    echo [✗] Git ไม่อยู่ใน System PATH
    echo.
    goto :fix_path
)

:fix_path
echo [!] กำลังเพิ่ม Git เข้า System PATH...
echo.

REM หา Git installation path
set GIT_PATH=
if exist "C:\Program Files\Git\cmd\git.exe" (
    set GIT_PATH=C:\Program Files\Git\cmd
) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
    set GIT_PATH=C:\Program Files (x86)\Git\cmd
) else (
    echo [✗] ไม่พบ Git ใน Program Files
    echo [!] กรุณาติดตั้ง Git ก่อน
    echo.
    pause
    exit /b 1
)

echo [i] พบ Git ที่: %GIT_PATH%
echo [i] กำลังเพิ่มเข้า System PATH...

REM เพิ่ม Git เข้า System PATH
setx /M PATH "%PATH%;%GIT_PATH%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [✓] เพิ่ม Git เข้า PATH สำเร็จ
    echo.
) else (
    echo [✗] ไม่สามารถเพิ่ม PATH ได้ (ต้องการสิทธิ์ Admin)
    echo.
    pause
    exit /b 1
)

:check_apache
echo [3/5] ตรวจสอบ Apache Service...
echo.

REM ตรวจสอบว่า Apache รันอยู่หรือไม่
sc query Apache2.4 >nul 2>&1
if %errorLevel% equ 0 (
    echo [✓] พบ Apache Service
    echo [i] กำลัง Restart Apache...
    net stop Apache2.4 >nul 2>&1
    timeout /t 2 /nobreak >nul
    net start Apache2.4 >nul 2>&1
    if %errorLevel% equ 0 (
        echo [✓] Restart Apache สำเร็จ
    ) else (
        echo [✗] ไม่สามารถ Start Apache ได้
    )
    echo.
) else (
    echo [!] ไม่พบ Apache Service (Apache2.4)
    echo [i] ข้ามขั้นตอนนี้ - กรุณา Restart Apache ด้วยตัวเอง
    echo.
)

:check_config
echo [4/5] ตรวจสอบ Config File...
echo.

REM ตรวจสอบว่ามีไฟล์ config.json หรือไม่
if exist "%~dp0includes\config.json" (
    echo [✓] พบไฟล์ config.json
    echo     %~dp0includes\config.json
    echo.
) else (
    echo [✗] ไม่พบไฟล์ config.json
    echo [!] กรุณาสร้างไฟล์ includes\config.json
    echo.
)

:check_system
echo [5/5] ตรวจสอบระบบทั้งหมด...
echo.

REM เปิด System Check ใน Browser
echo [i] กำลังเปิด System Check ใน Browser...
start http://localhost/Deploy%%20Tools/system-check.php
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   เสร็จสิ้น!
echo ========================================
echo.
echo ขั้นตอนถัดไป:
echo 1. ตรวจสอบหน้า System Check ที่เปิดขึ้นมา
echo 2. ต้องเป็น ✓ (สีเขียว) ทั้งหมด
echo 3. ถ้ายังมี ✗ (สีแดง) ให้แก้ไขตามที่บอก
echo 4. เปิด Deploy Tool: http://localhost/Deploy%%20Tools/GitDeployTool-Clean.php
echo.
echo เอกสารเพิ่มเติม:
echo - GIT_SETUP_CHECKLIST.md (คู่มือแก้ปัญหาแบบละเอียด)
echo - SETUP_GUIDE.md (คู่มือการติดตั้ง)
echo.
pause
