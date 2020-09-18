import http.server
import socketserver
import os

os.chdir('public')

handle = http.server.SimpleHTTPRequestHandler

port = 3000

socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", port), handle) as httpd:
    httpd.allow_reuse_address = True
    print("serving at port", port)
    httpd.serve_forever()

