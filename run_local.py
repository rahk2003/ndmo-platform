import signal
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def main():
    processes = [
        subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=ROOT / "backend"),
        subprocess.Popen(["npm", "run", "dev", "--", "--host", "127.0.0.1"], cwd=ROOT / "frontend"),
    ]

    def stop(*_args):
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            process.wait(timeout=10)
        raise SystemExit(0)

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    exit_code = next(process.wait() for process in processes)
    stop()
    return exit_code


if __name__ == "__main__":
    main()

