#!/bin/bash

wget https://www.clamav.net/downloads/production/clamav-1.4.1.linux.x86_64.deb -O /tmp/clamav-1.4.1.linux.x86_64.deb
sudo dpkg -i /tmp/clamav-1.4.1.linux.x86_64.deb
sudo tee /usr/local/etc/freshclam.conf > /dev/null << 'EOF'
# Example
DatabaseMirror database.clamav.net

# Maximum size of the log file (default: 1M)
LogFileMaxSize 2M

# Uncomment this option to enable logging with time
LogTime yes

# Number of database checks per day. Default: 12 (every two hours)
Checks 24

# Uncomment this option to enable verbose logging
# LogVerbose yes
EOF