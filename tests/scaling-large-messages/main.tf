terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {
  alias = "machine-0"
  host  = var.machines[0]
}

provider "docker" {
  alias = "machine-1"
  host  = var.machines[1]
}

provider "docker" {
  alias = "machine-2"
  host  = var.machines[2]
}

provider "docker" {
  alias = "machine-3"
  host  = var.machines[3]
}

provider "docker" {
  alias = "machine-4"
  host  = var.machines[4]
}

provider "docker" {
  alias = "machine-5"
  host  = var.machines[5]
}

provider "docker" {
  alias = "machine-6"
  host  = var.machines[6]
}

provider "docker" {
  alias = "machine-7"
  host  = var.machines[7]
}

provider "docker" {
  alias = "machine-8"
  host  = var.machines[8]
}

provider "docker" {
  alias = "machine-9"
  host  = var.machines[9]
}

provider "docker" {
  alias = "relay-machine"
  host  = var.relay-host
}

locals {
  relay_peer_id = "16Uiu2HAmLhLvBoYaoZfaMUKuibM6ac163GwKY74c5kiSLg5KvLpY"
  relay_private_key = "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED8FB"
  node_peer_ids = [
    "16Uiu2HAkykduGyaTTrv2sbS5VPiM1opuB8nwrLAFFbkcKJo12Rfp",
    "16Uiu2HAm3BY2vHeracYytkbcr4uZN3uXq8RfaQtFQoTvbNUrBb2f",
    "16Uiu2HAm2WNNuTmHNiVK2hYhJu7ZBWmKj7mHNG1aiX5WaXMrZG9n",
    "16Uiu2HAmNTC7kpXQbovW1kEtCJ5CDEtAGw2DcZ22SBBvGJS18M7E",
    "16Uiu2HAmTH1Rya56bKc84B8YbXFCrjpTra6ApHA92FPRTzkWHVjt",
    "16Uiu2HAmQYggzsuCnePKhHMJfRJsZAAauFcrpkZGYuiXfkqueQTy",
    "16Uiu2HAm4hsxuSJJHHBKfN1xXSauR1gwWLmvQCVjRkYDAzEvArWr",
    "16Uiu2HAmNox2uEXiBhNFDN6ssHMe4b9eBffodaTSQeZzs25sspVY",
    "16Uiu2HAmVhSVkyzwZvcHUyY7J7pU5PDFJ4iVC5hHb3A2Hs3uogKn",
    "16Uiu2HAm8zG2vtPf2Q4ExhsSZtcCTzTzCxY4F64Vtduc6kHPEdNQ",
    "16Uiu2HAmSjon8qun6SANsLP9Rm2SrX1Zmwb3XwVinF1UYH6gobUi",
    "16Uiu2HAm4yUHDkxyoXVQpUanR8cLfzXMdSBXNHaBTMvzBKiqkJSD",
    "16Uiu2HAmULwMmGM8r9WnAfwcyUQKW5kk7QyG7omihCZLQaxHL3id",
    "16Uiu2HAmTXHmJEc6eMNXswSA2zGEjC6mQLimFE4xUHc2vBbbiaie",
    "16Uiu2HAkztUutiTKFrjnpy8Bsxxwt8WcUQGJN3wrp562GMokTpfs",
    "16Uiu2HAkwA4gJ9191vMaowQb9uRFrJsFKdKvwHkusXARkfZD2m4m",
    "16Uiu2HAkvK2ZZSczh3gM7UKLKUtzNywnKz6ZyRpHvarDZCVCdwuu",
    "16Uiu2HAmDGo4odJjeNqkA3U5QaNcgAkTiGNxg1n7N5vhe4GihcTD",
    "16Uiu2HAmKXAFrEZbhDaF6w6dDbW4brhoQidLjUvovBo78pVEbQ1w",
    "16Uiu2HAm6BkEADAtEN6YdWwxTJo2FpTmZ9VoswwpEjX1uPs9sW1V",
    "16Uiu2HAmD2xpc8sgQC6j42Tz4SWmkVXAcwMJnfXHXmDAcfNDqhVL",
    "16Uiu2HAmRL4FvuU6p3QgYQXPZyE6KBPTGiUjJmJjcoKFQpPu8FRs",
    "16Uiu2HAm2P3EDniN91qv8mxyTxvtqLR5sgwL3tbyMnTCfhxe9Qhx",
    "16Uiu2HAmRr7fccFXHqD6VGXJTcyuwVNjEp1dwk66Updf8YWtA3Tw",
    "16Uiu2HAkxcr6mjnQUePe7axVpjQEjuUNB43bxrKdfaNVJe43FxeQ",
    "16Uiu2HAmUiv8fF9BTmTzWeWKm8kpge7PHq4cKrgjgdZ2w6WpxHX9",
    "16Uiu2HAmRWK6Q2cdvDfaaMg5Ybt1BctxTp5AB16CpPH61PsGKS74",
    "16Uiu2HAmMJPD8Yr6aXHCrtUF91p7ifXhhvrsJdRjr4vr4LfXYwki",
    "16Uiu2HAmGtoHooFuHddu44rtm5yoodpyfP6hzTBeo7JPAYuwwAam",
    "16Uiu2HAm1vQzkH3rUaHPTHWX74fZoyT1URNDqHNCaSqLwoDSVppR",
    "16Uiu2HAkzNB4nkwnBPy5GPRmdDFJTEBXRUAArAUDaYpNCYDrLTrB",
    "16Uiu2HAm3nnNwidpojv9e8FjMMrk2C1wxXD82WaW51gFJMw3Pqf9",
    "16Uiu2HAmPrKEPdS4WDSPTxVAX4J1XpKaKcyWUtcgQ7eq17AnLiEf",
    "16Uiu2HAmPUJShifRseVUX7Ed3HBTBrn3uB2EX8bfaDQoRKWfgYpH",
    "16Uiu2HAmE2opd1R4Aw31EWrPGvjpMTdBejU9H59RwDiSJHGwaq41",
    "16Uiu2HAkv5pTUJHN5T9YZEXr3M5CnnsMPt2VxTqFg2Jdc1PZnu5L",
    "16Uiu2HAmJpY3D531m9dy6XHZA93Mx5JRpLFAHWoKNcwybZSHYedw",
    "16Uiu2HAmPVLymKwe8Tn563P8Zm2ypNQzMebz4VHL5M6WcRpejHFK",
    "16Uiu2HAkz9qxRtMwbEEctXvx7U7i9i5eHpk6qzDgYTtMoLibJ14j",
    "16Uiu2HAmRUtGay745Rmc4EUxxykVtadgKvgYPbf9mj4JmrWJtThp",
  ]
  node_private_keys = [
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED800",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED801",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED802",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED803",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED804",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED805",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED806",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED807",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED808",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED809",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED810",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED811",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED812",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED813",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED814",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED815",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED816",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED817",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED818",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED819",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED820",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED821",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED822",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED823",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED824",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED825",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED826",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED827",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED828",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED829",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED830",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED831",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED832",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED833",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED834",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED835",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED836",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED837",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED838",
    "0802122053DADF1D5A164D6B4ACDB15E24AA4C5B1D3461BDBD42ABEDB0A4404D56CED839",
  ]
}

data "docker_registry_image" "rosenet-node" {
  name = "ghcr.io/rosen-bridge/scaling-large-messages-test-node"
}

data "docker_registry_image" "rosenet-relay" {
  name = "ghcr.io/rosen-bridge/scaling-large-messages-test-relay"
}

resource "docker_image" "rosenet-node-0" {
  provider = docker.machine-0

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-1" {
  provider = docker.machine-1

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-2" {
  provider = docker.machine-2

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-3" {
  provider = docker.machine-3

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-4" {
  provider = docker.machine-4

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-5" {
  provider = docker.machine-5

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-6" {
  provider = docker.machine-6

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-7" {
  provider = docker.machine-7

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-8" {
  provider = docker.machine-8

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-node-9" {
  provider = docker.machine-9

  name          = data.docker_registry_image.rosenet-node.name
  pull_triggers = [data.docker_registry_image.rosenet-node.sha256_digest]
}

resource "docker_image" "rosenet-relay" {
  provider = docker.relay-machine

  name          = data.docker_registry_image.rosenet-relay.name
  pull_triggers = [data.docker_registry_image.rosenet-relay.sha256_digest]
}

resource "docker_container" "rosenet-node-0" {
  provider = docker.machine-0
  count = 4

  name  = "node-${count.index}"
  image = docker_image.rosenet-node-0.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-1" {
  provider = docker.machine-1
  count = 4

  name  = "node-${count.index + 4}"
  image = docker_image.rosenet-node-1.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 4]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 4]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-2" {
  provider = docker.machine-2
  count = 4

  name  = "node-${count.index + 8}"
  image = docker_image.rosenet-node-2.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 8]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 8]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-3" {
  provider = docker.machine-3
  count = 4

  name  = "node-${count.index + 12}"
  image = docker_image.rosenet-node-3.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 12]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 12]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-4" {
  provider = docker.machine-4
  count = 4

  name  = "node-${count.index + 16}"
  image = docker_image.rosenet-node-4.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 16]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 16]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-5" {
  provider = docker.machine-5
  count = 4

  name  = "node-${count.index + 20}"
  image = docker_image.rosenet-node-5.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 20]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 20]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-6" {
  provider = docker.machine-6
  count = 4

  name  = "node-${count.index + 24}"
  image = docker_image.rosenet-node-6.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 24]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 24]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-7" {
  provider = docker.machine-7
  count = 4

  name  = "node-${count.index + 28}"
  image = docker_image.rosenet-node-7.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 28]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 28]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-8" {
  provider = docker.machine-8
  count = 4

  name  = "node-${count.index + 32}"
  image = docker_image.rosenet-node-8.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 32]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 32]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-node-9" {
  provider = docker.machine-9
  count = 4

  name  = "node-${count.index + 36}"
  image = docker_image.rosenet-node-9.image_id
  env = [
    "RELAY_MULTIADDR=/ip4/${var.relay-ip}/tcp/33333/p2p/${local.relay_peer_id}", "PRIVATE_KEY=${local.node_private_keys[count.index + 36]}", "ALL_PEER_IDS=${join("," ,local.node_peer_ids)}", "NODE_PEER_ID=${local.node_peer_ids[count.index + 36]}"]

  depends_on = [
    docker_container.rosenet-relay,
    docker_image.rosenet-node-0,
    docker_image.rosenet-node-1,
    docker_image.rosenet-node-2,
    docker_image.rosenet-node-3,
    docker_image.rosenet-node-4,
    docker_image.rosenet-node-5,
    docker_image.rosenet-node-6,
    docker_image.rosenet-node-7,
    docker_image.rosenet-node-8,
    docker_image.rosenet-node-9,
  ]
}

resource "docker_container" "rosenet-relay" {
  provider = docker.relay-machine

  name     = "relay"
  image    = docker_image.rosenet-relay.image_id
  env = ["PRIVATE_KEY=${local.relay_private_key}", "WHITELIST=${join(",", local.node_peer_ids)}", "LISTEN_PORT=33333"]
  ports {
    internal = 33333
    external = 33333
  }
}
