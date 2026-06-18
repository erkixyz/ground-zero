#!/bin/sh
set -e
# Sentinel modifies its config at runtime, so copy template to writable location
cp /etc/sentinel-template.conf /tmp/sentinel.conf
exec redis-sentinel /tmp/sentinel.conf
