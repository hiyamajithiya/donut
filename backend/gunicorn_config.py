import multiprocessing

# Server socket
bind = "127.0.0.1:8005"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 300
keepalive = 2

# Logging
accesslog = "/var/log/donut/access.log"
errorlog = "/var/log/donut/error.log"
loglevel = "info"

# Process naming
proc_name = "donut"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL
keyfile = None
certfile = None
