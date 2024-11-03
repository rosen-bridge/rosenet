# RoseNet Global Test

## Table of Contents

- [RoseNet Global Test](#rosenet-global-test)
  - [Table of Contents](#table-of-contents)
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
- Access to a server with a public IP (for relay setup)

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
vim .env # Use editor of your choice

# Start the service
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
   - Optional:
     - `PORT`: Relay service port
     - `MAX_RESERVATIONS`: Maximum number of reservation slots, indicating how many nodes can connect to this relay
     - `LOGS_DIRECTORY`: The path to the directory containing logs

4. **Launch Relay**

   ```bash
   docker compose up -d
   ```

5. **Get Relay Multiaddress**

   - Check logs at `tests/global/src/relay/logs/info/*.log`
   - Format your multiaddress:
     ```
     /ip4/<SERVER_IP>/tcp/<PORT>/p2p/<PEER_ID>
     # or
     /dns4/<DOMAIN>/tcp/<PORT>/p2p/<PEER_ID>
     ```

   For example, having this log entry in a server with IP address of `100.100.100.100`, domain of `example.com`, and default 44123 port:

   ```log
   2024-10-26T07:36:54.652Z info: [rosenet] PeerId 12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp generated
   ```

   Your multiaddr can be represented as either `/ip4/100.100.100.100/tcp/44123/p2p/12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp` or `/dns4/example.com/tcp/44123/p2p/12D3KooWDvTUsPV6DSCJXJWJQjSoJ4q172kPRe4MHgxYqTz7J4jp`.

### Node Setup

1. **Clone and Navigate**

   ```bash
   git clone https://github.com/rosen-bridge/rosenet.git
   cd rosenet/tests/global/src/node
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   ```

3. **Configuration Options**

   - Required:
     - `RELAY_MULTIADDRS`: Comma-separated list of relay multiaddresses
   - Optional (Modify only if you understand the side effects of the changes):
     - Message Configurations:
       - `SHOULD_SEND_DIRECT_TO_OLD_PEERS`: Whether to send direct messages to previously connected but now disconnected peers
       - `DIRECT_BURST_SIZE`: Number of direct messages to send in one burst (shared between all peers)
       - `PUBSUB_BURST_SIZE`: Number of pubsub messages to send in one burst (affects network traffic)
       - `MIN_MESSAGE_SIZE`: Minimum size for both direct and pubsub messages
       - `MAX_MESSAGE_SIZE`: Maximum size for both direct and pubsub messages
     - Timing Configuration:
       - `MIN_IDLE_TIME`: Minimum wait time between bursts
       - `MAX_IDLE_TIME`: Maximum wait time between bursts
       - `MIN_SCNEARIO_DURATION`: Minimum duration for any scenario type
       - `MAX_SCNEARIO_DURATION`: Maximum duration for any scenario type
     - Service Configuration:
       - `SERVICE_PORT`: Node service port
       - `LOGS_DIRECTORY`: Path to logs directory
     - InfluxDB Configuration:
       - `INFLUXDB_HOST`: Host address (e.g., for exposing UI on all interfaces)
       - `INFLUXDB_PORT`: Port number
       - `INFLUXDB_USERNAME`: Custom username for security
       - `INFLUXDB_PASSWORD`: Custom password for security
       - `INFLUXDB_ADMIN_TOKEN`: Custom admin token for security

4. **Initial Run and Whitelisting**

   ```bash
   docker compose up -d
   ```

   > **Note**: The service will fail until your node is whitelisted in at least one relay. Check logs at `tests/global/src/node/logs/info/*.log` to find your node's peer ID.

5. **Complete Setup**

   - Get your node's peer ID from the logs
   - Have it whitelisted in at least one relay
   - Restart the service if it's stopped for some reason:
     ```bash
     docker compose up -d
     ```

   > **Note**: Docker compose restart policy of the node is set to always. So by default, you don't need to run step 3, and only need to wait for the whitelisting.

## Test Execution

Once properly configured, your node will automatically participate in the test network by sending and receiving pubsub and direct messages, and logging relevant activities. The test operates through randomly selected scenarios:

- **Break**: No messages sent
- **Direct**: Only direct messages
- **Pubsub**: Only pubsub messages
- **Combined**: Both direct and pubsub messages

Each scenario consists of multiple bursts, with idle periods between them to prevent resource exhaustion. All durations (idle times, bursts, and scenarios) are randomly chosen within the configured ranges, with reasonable defaults provided.

## Data Collection and Analysis

After the test is over, analyze the results through the node's database:

1. **Access InfluxDB Dashboard**

   - Default URL (unless customized in environment variables): `http://localhost:8086`
   - Default credentials (unless customized in environment variables):
     - Username: `admin`
     - Password: `admin1234`

2. **Extract Test Results**
   - Navigate to "Data Explorer"
   - Select bucket: `RoseNet`
   - Choose measurements: `direct` and `pubsub`
   - Change period to an appropriate one (e.g., a week)
   - Export data using the CSV button
