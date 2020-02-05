@echo off

:: pull the latest changes from master
git pull origin master

:: build
call yarn install
call yarn build

:: add new files and commit
git add .
git commit -m "Updated the npm package."
