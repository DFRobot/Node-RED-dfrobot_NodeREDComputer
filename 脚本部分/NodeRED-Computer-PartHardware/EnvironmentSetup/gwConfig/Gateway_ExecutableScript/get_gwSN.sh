#!/bin/sh

cat /proc/cpuinfo | grep "Serial" | awk '{print $3}'