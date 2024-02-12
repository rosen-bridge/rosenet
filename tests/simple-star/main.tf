terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {
  alias = "node-machine"
  host  = var.node-host
}

provider "docker" {
  alias = "relay-machine"
  host  = var.relay-host
}

resource "docker_image" "rosenet-node" {
  provider = docker.node-machine

  build {
    context = "../.."
    dockerfile = "./tests/simple-star/src/node/Dockerfile"
  }
  name = "rosenet-node"

  triggers = {
    node_sha1 = filesha1("./src/node/node.ts")
    dockerfile_sha1 = filesha1("./src/node/Dockerfile")
  }
}

resource "docker_image" "rosenet-relay" {
  provider = docker.relay-machine

  build {
    context = "../.."
    dockerfile = "./tests/simple-star/src/relay/Dockerfile"
  }
  name     = "rosenet-relay"

  triggers = {
    relay_sha1 = filesha1("./src/relay/relay.ts")
    dockerfile_sha1 = filesha1("./src/relay/Dockerfile")
  }
}

resource "docker_container" "rosenet-node" {
  provider = docker.node-machine

  count = 2

  name  = "node-${count.index}"
  image = docker_image.rosenet-node.image_id
  env = ["RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/16Uiu2HAmLhLvBoYaoZfaMUKuibM6ac163GwKY74c5kiSLg5KvLpY"]

  depends_on = [docker_container.rosenet-relay]
}

resource "docker_container" "rosenet-relay" {
  provider = docker.relay-machine

  name     = "relay"
  image    = docker_image.rosenet-relay.image_id
  env = ["PRIVATE_KEY=0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED8FB", "LISTEN_PORT=33333"]
  ports {
    internal = 33333
    external = 33333
  }
}

data "docker_logs" "relay-logs" {
  provider = docker.relay-machine

  name = docker_container.rosenet-relay.name
  tail = 10

  lifecycle {
    postcondition {
      # Check if relay creation log is present
      condition = strcontains(reverse(self.logs_list_string)[0], "created")
      error_message = "The relay was not created"
    }
  }
}

data "docker_logs" "node-logs" {
  provider = docker.node-machine

  count = 2

  name = docker_container.rosenet-node[count.index].name
  tail = 10

  lifecycle {
    postcondition {
      # Check if node creation log is present
      condition = strcontains(reverse(self.logs_list_string)[0], "created")
      error_message = "The node was not created"
    }
  }
}
