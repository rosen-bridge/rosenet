# RoseNet global test

## Table of contents

- [RoseNet global test](#rosenet-global-test)
  - [Table of contents](#table-of-contents)
  - [System Requirements](#system-requirements)
  - [Quick Start](#quick-start)
  - [Detailed Setup Instructions](#detailed-setup-instructions)
    - [Relay Setup](#relay-setup)
    - [Node Setup](#node-setup)
  - [Test Execution](#test-execution)
  - [Data Collection and Analysis](#data-collection-and-analysis)

## System Requirements

- Git
- Docker and Docker Compose
- Access to a server with a public ip (for relay setup)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/rosen-bridge/rosenet.git

# Choose your setup type:
# For relay setup:
cd rosenet/tests/global/src/relay

# For node setup:
cd rosenet/tests/global/src/node

# Create service configuration file
cp .env.example .env
# Edit .env file with your configuration
docker compose up -d
```

## Detailed Setup Instructions

### Relay Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/rosen-bridge/rosenet.git
   cd rosenet/tests/global/src/relay
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   ```

3. **Configuration Options**

   - Required:
     - `WHITELIST`: Comma-separated list of allowed node peer IDs

4. **Launch Relay**

   ```bash
   docker compose up -d
   ```

5. **Get Relay Multiaddress**

   - Check debug logs at `tests/global/src/relay/logs/debug/*.log`
   - Format your multiaddress:
     ```
     /ip4/<SERVER_IP>/tcp/<PORT>/p2p/<PEER_ID>
     # or
     /dns4/<DOMAIN>/tcp/<PORT>/p2p/<PEER_ID>
     ```

   For example, having this log entry in a server with ip address of `100.100.100.100`, domain of `example.com`, and default 44123 port:

   ```log
   2024-10-26T07:36:54.652Z debug: [rosenet] PeerId 12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp generated
   ```

   Your multiaddr can be represented as either `/ip4/100.100.100.100/tcp/44123/p2p/12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp` or `/dns4/example.com/tcp/44123/p2p/12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp`.

### Node Setup

1. **Clone and Navigate**

   ```bash
   git clone https://github.com/rosen-bridge/rosenet.git
   cd tests/global/src/node
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   ```

3. **Configuration Options**

   - Required:
     - `RELAY_MULTIADDRS`: Comma-separated list of relay multiaddresses

4. **Initial Run and Whitelisting**

   ```bash
   docker compose up -d
   ```

   > **Note**: The first run will fail as your node needs whitelisting. Check debug logs at `tests/global/src/node/logs/debug/*.log` to find your node's peer ID.

5. **Complete Setup**
   - Get your node's peer ID from the debug logs
   - Have it whitelisted in at least one relay
   - Restart the service:
     ```bash
     docker compose up -d
     ```

## Test Execution

Once properly configured, your node will automatically participate in the test network by sending and receiving pubsub and direct messages, and logging relevant activities.

## Data Collection and Analysis

After the test is over, the results can be analyzed by checking the database of the nodes:

1. **Access InfluxDB Dashboard**

   - URL: `http://localhost:8086`
   - Credentials:
     - Username: `admin`
     - Password: `admin1234`

2. **Extract Test Results**
   - Navigate to "Data Explorer"
   - Select bucket: `RoseNet`
   - Choose measurements: `direct` and `pubsub`
   - Export data using the CSV button
