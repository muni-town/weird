#!/bin/bash
docker build -t kraft-rauthy .
temp_id=$(docker create kraft-rauthy)
rm -rf rootfs.out
mkdir -p rootfs.out
cd rootfs.out
docker export $temp_id | tar -x
rm -rf etc sys dev proc
docker rm $temp_id
cd ../
