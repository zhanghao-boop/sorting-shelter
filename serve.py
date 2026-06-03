#!/usr/bin/env python3
"""
Sorting Shelter — local share-server
====================================
- Serves the whole pet-rescue-mvp/ folder on http://0.0.0.0:8080
- Detects LAN IP, prints colored URLs for desktop + mobile
- Auto-opens /share.html where a QR code is rendered in-browser via qrcode.js
  → scan with phone (same Wi-Fi) and instantly play
- Optional: pass `--tunnel` and we'll attempt cloudflared / ngrok for the public link
  (only if either is installed in PATH)

Usage:
  python3 serve.py
  python3 serve.py --port 8088
  python3 serve.py --tunnel        # attempt public tunnel (needs cloudflared/ngrok)
"""
from __future__ import annotations
import argparse, http.server, socket, socketserver, sys, threading, webbrowser, subprocess, shutil, time, os, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# --- ANSI colors -----------------------------------------------------------
class C:
    R='\033[31m'; G='\033[32m'; Y='\033[33m'; B='\033[34m'
    M='\033[35m'; CY='\033[36m'; W='\033[37m'; X='\033[0m'
    BOLD='\033[1m'; DIM='\033[2m'

def lan_ips() -> list[str]:
    """Return all non-loopback IPv4 addresses on this machine, primary LAN first."""
    ips: list[str] = []  # ordered, dedup
    seen = set()
    def add(ip: str):
        if not ip or ip in seen: return
        if ip.startswith('127.'):    return  # loopback
        if ip.startswith('169.254.'): return  # link-local
        if ip.startswith('0.'):       return
        if ip.startswith('198.18.'):  return  # benchmarking range some VPNs use
        seen.add(ip); ips.append(ip)

    # Method 1 (macOS/Linux): `ifconfig` parsing — gives us *every* interface
    # including the real Wi-Fi (en0) that VPNs hide from routing.
    try:
        out = subprocess.check_output(['ifconfig'], text=True, timeout=2)
        current_iface = None
        for line in out.splitlines():
            if line and not line.startswith((' ', '\t')):
                current_iface = line.split(':')[0]
            m = re.search(r'^\s*inet (\d+\.\d+\.\d+\.\d+)\s', line)
            if m:
                ip = m.group(1)
                # Skip point-to-point (VPN/tunnel) entries — they include `-->`
                if '-->' in line: continue
                # Prefer en0 / en1 (Wi-Fi/Ethernet) — push them first
                if current_iface and current_iface.startswith(('en0','en1','wlan','eth')):
                    # Insert at front to mark as primary
                    if ip not in seen and not ip.startswith(('127.','169.254.','198.18.','0.')):
                        seen.add(ip); ips.insert(0, ip)
                else:
                    add(ip)
    except Exception:
        pass

    # Method 2: socket trick (routable destination)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('1.1.1.1', 80))
        add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    # Method 3: hostname-based fallback (final safety net)
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            add(info[4][0])
    except Exception:
        pass

    return ips

# --- HTTP server -----------------------------------------------------------
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Suppresses verbose default logging — only show real requests succinctly."""
    def log_message(self, fmt, *args):
        msg = fmt % args
        # Skip noisy 304 / favicon
        if '304' in msg or 'favicon' in msg.lower(): return
        sys.stdout.write(f"{C.DIM}  {self.address_string()}  {msg}{C.X}\n")
        sys.stdout.flush()

# Allow reuse so re-running doesn't get stuck on TIME_WAIT
class ReuseTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

def start_server(port: int) -> ReuseTCPServer:
    os.chdir(ROOT)
    httpd = ReuseTCPServer(('0.0.0.0', port), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd

# --- Tunneling (optional) --------------------------------------------------
def try_tunnel(port: int):
    """Try cloudflared first, then ngrok. Return the public URL or None."""
    if shutil.which('cloudflared'):
        print(f"{C.Y}→ Starting cloudflared tunnel...{C.X}")
        try:
            p = subprocess.Popen(
                ['cloudflared', 'tunnel', '--url', f'http://localhost:{port}'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            )
            for line in p.stdout:  # type: ignore
                line = line.strip()
                if 'trycloudflare.com' in line:
                    # Extract the URL
                    import re
                    m = re.search(r'https://[\w\-.]+\.trycloudflare\.com', line)
                    if m:
                        return m.group(0)
            return None
        except Exception as e:
            print(f"{C.R}cloudflared failed: {e}{C.X}")
    if shutil.which('ngrok'):
        print(f"{C.Y}→ Starting ngrok tunnel...{C.X}")
        try:
            p = subprocess.Popen(
                ['ngrok', 'http', str(port), '--log=stdout'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            )
            for line in p.stdout:  # type: ignore
                if 'started tunnel' in line.lower() or 'url=https' in line.lower():
                    import re
                    m = re.search(r'https://[\w\-.]+\.ngrok[\w\-.]*', line)
                    if m: return m.group(0)
            return None
        except Exception as e:
            print(f"{C.R}ngrok failed: {e}{C.X}")
    return None

# --- Pretty banner ---------------------------------------------------------
BANNER = r"""
   ____            _   _              ____  _          _ _
  / ___|  ___  _ _| |_(_)_ __   __ _ / ___|| |__   ___| | |_ ___ _ __
  \___ \ / _ \| '_| __| | '_ \ / _` |\___ \| '_ \ / _ \ | __/ _ \ '__|
   ___) | (_) | |  | |_| | | | | (_| | ___) | | | |  __/ | ||  __/ |
  |____/ \___/|_|   \__|_|_| |_|\__, ||____/|_| |_|\___|_|\__\___|_|
                                |___/
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--tunnel', action='store_true',
                    help='Attempt public tunnel via cloudflared/ngrok if installed')
    ap.add_argument('--no-browser', action='store_true', help="Don't auto-open browser")
    args = ap.parse_args()

    print(f"{C.CY}{BANNER}{C.X}")
    print(f"{C.BOLD}Serving:{C.X} {ROOT}\n")

    try:
        httpd = start_server(args.port)
    except OSError as e:
        print(f"{C.R}Failed to bind port {args.port}: {e}{C.X}")
        print(f"{C.Y}Try a different port: python3 serve.py --port 8088{C.X}")
        sys.exit(1)

    ips = lan_ips()
    local_url = f"http://localhost:{args.port}/v2/"
    v1_url    = f"http://localhost:{args.port}/index.html"
    share_url = f"http://localhost:{args.port}/share.html"

    print(f"{C.BOLD}{C.G}✓ Server running on port {args.port}{C.X}")
    print(f"\n{C.BOLD}On this Mac:{C.X}")
    print(f"  {C.G}→ v2 (new):{C.X}        {C.BOLD}{local_url}{C.X}")
    print(f"  {C.DIM}→ v1 (original):  {v1_url}{C.X}")
    print(f"  {C.M}→ Share / QR:     {share_url}{C.X}")

    print(f"\n{C.BOLD}On your phone (same Wi-Fi):{C.X}")
    if ips:
        for ip in ips:
            print(f"  {C.B}→ http://{ip}:{args.port}/v2/{C.X}")
    else:
        print(f"  {C.R}⚠ No LAN IP detected — connect to a Wi-Fi network first.{C.X}")

    print(f"\n{C.BOLD}For friends not on your Wi-Fi:{C.X}")
    public_url = None
    if args.tunnel:
        public_url = try_tunnel(args.port)
        if public_url:
            print(f"  {C.G}{C.BOLD}→ Public URL: {public_url}/v2/{C.X}")
            print(f"  {C.DIM}(Tunnel kept open while this script runs){C.X}")
        else:
            print(f"  {C.R}No tunnel tool found. Install one of:{C.X}")
            print(f"    {C.DIM}- brew install cloudflared    (recommended, free, no signup){C.X}")
            print(f"    {C.DIM}- brew install ngrok           (needs ngrok.com account){C.X}")
            print(f"  {C.DIM}Then re-run with --tunnel{C.X}")
    else:
        print(f"  {C.DIM}Re-run with --tunnel to expose a public URL (needs cloudflared or ngrok){C.X}")
        print(f"  {C.DIM}Or upload v2/ to GitHub Pages / Cloudflare Pages / Vercel for permanent hosting{C.X}")

    print(f"\n{C.DIM}Press Ctrl+C to stop.{C.X}\n")

    if not args.no_browser:
        # Open the share page on the FIRST LAN IP if we have one. Why?
        # If we opened http://localhost:8080/share.html the QR codes inside
        # encode `localhost:8080/v2/` — useless for a phone. Using the LAN IP
        # makes the QR carry the phone-reachable URL automatically.
        share_to_open = share_url
        if ips:
            share_to_open = f"http://{ips[0]}:{args.port}/share.html#lan={','.join(ips)}"
        try:
            webbrowser.open(share_to_open)
        except Exception:
            pass

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{C.Y}Stopping...{C.X}")
        httpd.shutdown()
        sys.exit(0)

if __name__ == '__main__':
    main()
