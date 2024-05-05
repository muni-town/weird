#!/bin/bash
set -x

# TODO: encryption keys.
kraft cloud deploy \
  --name weird-rauthy \
  --service-group weird-rauthy \
  -e PUB_URL=auth.weird.sandbox.katharos.group \
  -e PROXY_MODE=true \
  -e DATABASE_URL=postgresql://postgres:password@weird-rauthy-postgres.internal/postgres \
  -M 250 \
  khaws/weird-rauthy
  
