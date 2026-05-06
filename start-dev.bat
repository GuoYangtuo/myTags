@echo off
title myTags Backend
start cmd /k "cd /d %~dp0backend && npm run dev"

title myTags Frontend
start cmd /k "cd /d %~dp0frontend && npm run dev"
