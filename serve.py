#!/usr/bin/env python3
"""Serve the game folder without browser caching, so edits to src/*.js always load.

    python3 serve.py          # http://localhost:8765
    python3 serve.py 9000     # another port
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"Eden at http://localhost:{port}  (tests at /tests.html)")
    ThreadingHTTPServer(("127.0.0.1", port), NoCache).serve_forever()
