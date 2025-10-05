@echo off
echo Starting Donut Trainer Development Environment
echo.

echo Starting Redis server (required for Celery)...
echo Please make sure Redis is installed and running on localhost:6379
echo.

echo Starting Django development server...
cd backend
start "Django Server" cmd /k "python manage.py runserver"

echo.
echo Starting Celery worker...
start "Celery Worker" cmd /k "celery -A donut_trainer worker --loglevel=info"

echo.
echo Starting React frontend...
cd ..\frontend
start "React App" cmd /k "npm start"

echo.
echo All services started!
echo - Django API: http://localhost:8000/api
echo - React App: http://localhost:3000
echo - Django Admin: http://localhost:8000/admin
echo.
echo Press any key to exit...
pause