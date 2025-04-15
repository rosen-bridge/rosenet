---
'@rosen-bridge/rosenet-node': patch
---

Fix the address-service to return IPv4. The publicIp package automatically returns IPv6, which will cause issues on most networks.
