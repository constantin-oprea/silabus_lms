# 1. Add all changes
git add .

# 2. Commit with a timestamp
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Update: $date"

# 3. Push to GitHub
git push origin main

Write-Host "Code pushed! Now remember to run 'git pull' and 'collectstatic' on PythonAnywhere." -ForegroundColor Green