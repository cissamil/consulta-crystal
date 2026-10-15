@echo off
setlocal
cd /d "%~dp0"
title Publicar Consulta RPT

echo ============================================
echo   Publicar Consulta RPT (gera a pasta pronta)
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e rode de novo.
  pause
  exit /b 1
)

where dotnet >nul 2>nul
if errorlevel 1 (
  echo [ERRO] .NET SDK nao encontrado. Instale em https://dotnet.microsoft.com/download e rode de novo.
  pause
  exit /b 1
)

tasklist /FI "IMAGENAME eq ConsultaRPT.exe" 2>nul | find /I "ConsultaRPT.exe" >nul
if not errorlevel 1 (
  echo [AVISO] O ConsultaRPT esta aberto e trava os arquivos da pasta publicado.
  choice /C SN /M "Fechar o ConsultaRPT agora"
  if errorlevel 2 (
    echo Feche o ConsultaRPT e rode o publicar.bat de novo.
    pause
    exit /b 1
  )
  taskkill /IM ConsultaRPT.exe /F >nul
  timeout /t 2 /nobreak >nul
  echo.
)

echo [1/3] Compilando a tela (React)...
pushd rpt-frontend
if not exist node_modules (
  echo      Instalando dependencias, so na primeira vez...
  call npm install
  if errorlevel 1 goto :erro
)
rem Na versao publicada a tela fala com a propria API: endereco relativo.
set VITE_API_BASE_URL=/api
call npm run build -- --outDir ..\CrystalReportsRptApi\wwwroot --emptyOutDir
if errorlevel 1 goto :erro
popd

echo.
echo [2/3] Compilando a API (C#)...
if exist publicado rmdir /s /q publicado
dotnet publish CrystalReportsRptApi\CrystalReportsRptApi.csproj -c Release -o publicado
if errorlevel 1 goto :erro

echo.
echo [3/3] Gerando o arquivo ConsultaRPT.zip...
(
  echo COMO USAR
  echo 1. Instale uma vez o SAP Crystal Reports runtime 64 bits, SP40.
  echo 2. Extraia esta pasta em qualquer lugar, por exemplo C:\ConsultaRPT.
  echo 3. De dois cliques em ConsultaRPT.exe. O navegador abre sozinho.
  echo 4. Deixe a janela preta aberta enquanto usar. Para sair, feche a janela.
) > publicado\LEIA-ME.txt
if exist ConsultaRPT.zip del ConsultaRPT.zip
powershell -NoProfile -Command "Compress-Archive -Path 'publicado\*' -DestinationPath 'ConsultaRPT.zip' -Force"

echo.
echo ============================================
echo   PRONTO!
echo   Pasta: publicado\   (teste: ConsultaRPT.exe)
echo   Zip para a equipe: ConsultaRPT.zip
echo ============================================
pause
exit /b 0

:erro
echo.
echo [ERRO] Algo deu errado. Leia as mensagens acima.
pause
exit /b 1
