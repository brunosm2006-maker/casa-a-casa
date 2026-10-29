@echo off
cd /d "%~dp0"
echo Abre http://127.0.0.1:8081 en el navegador.
echo Conserva esta ventana abierta mientras usas la aplicacion.
node tools\serve.mjs
pause
