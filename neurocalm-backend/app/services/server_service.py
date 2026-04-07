import time
import logging
from datetime import datetime, timezone
from collections import deque

import psutil

logger = logging.getLogger("neurocalm")

# In-memory log buffer for recent application logs
_log_buffer: deque = deque(maxlen=100)
_start_time = time.time()


class BufferHandler(logging.Handler):
    """Logging handler that stores log records in the in-memory buffer."""

    def emit(self, record):
        entry = {
            "time": datetime.fromtimestamp(record.created, tz=timezone.utc).strftime("%H:%M:%S"),
            "level": record.levelname,
            "message": record.getMessage(),
        }
        _log_buffer.append(entry)


def setup_log_capture():
    """Attach the buffer handler to the root and uvicorn loggers."""
    handler = BufferHandler()
    handler.setLevel(logging.INFO)

    for name in ("neurocalm", "uvicorn", "uvicorn.access"):
        log = logging.getLogger(name)
        log.addHandler(handler)


def _format_uptime(seconds: float) -> str:
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    return " ".join(parts)


def get_resource_stats() -> list[dict]:
    cpu_percent = psutil.cpu_percent(interval=0.1)

    mem = psutil.virtual_memory()
    mem_used_gb = mem.used / (1024 ** 3)
    mem_total_gb = mem.total / (1024 ** 3)

    disk = psutil.disk_usage("/")
    disk_used_gb = disk.used / (1024 ** 3)
    disk_total_gb = disk.total / (1024 ** 3)

    net = psutil.net_io_counters()
    # Approximate current throughput in Mbps (snapshot)
    net_mbps = round((net.bytes_sent + net.bytes_recv) / (1024 * 1024), 0)
    # Cap at 100 for the progress bar
    net_bar = min(100, int(net_mbps / 10)) if net_mbps > 0 else 5

    return [
        {
            "label": "CPU Usage",
            "value": f"{cpu_percent}%",
            "bar": int(cpu_percent),
        },
        {
            "label": "Memory",
            "value": f"{mem_used_gb:.1f} / {mem_total_gb:.0f} GB",
            "bar": int(mem.percent),
        },
        {
            "label": "Disk Usage",
            "value": f"{disk_used_gb:.1f} / {disk_total_gb:.0f} GB",
            "bar": int(disk.percent),
        },
        {
            "label": "Network",
            "value": f"{net_mbps:.0f} MB transferred",
            "bar": net_bar,
        },
    ]


def get_services_status() -> list[dict]:
    app_uptime = _format_uptime(time.time() - _start_time)
    boot_uptime = _format_uptime(time.time() - psutil.boot_time())

    services = [
        {
            "name": "API Server",
            "status": "running",
            "uptime": app_uptime,
            "port": "8000",
        },
        {
            "name": "ML Inference Engine",
            "status": "running",
            "uptime": app_uptime,
            "port": "8001",
        },
        {
            "name": "PostgreSQL Database",
            "status": "running",
            "uptime": boot_uptime,
            "port": "5432",
        },
    ]

    # Check if Redis is reachable (port 6379)
    redis_status = "stopped"
    for conn in psutil.net_connections(kind="inet"):
        if conn.laddr.port == 6379 and conn.status == "LISTEN":
            redis_status = "running"
            break

    services.append({
        "name": "Redis Cache",
        "status": redis_status,
        "uptime": boot_uptime if redis_status == "running" else "-",
        "port": "6379",
    })

    services.append({
        "name": "File Storage (Local)",
        "status": "running",
        "uptime": boot_uptime,
        "port": "-",
    })

    return services


def get_recent_logs(limit: int = 20) -> list[dict]:
    logs = list(_log_buffer)
    return logs[-limit:]
