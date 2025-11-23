# Technitium DNS Prometheus Exporter

## Basic requirements

For the exporter to retrieve data, we need an access token for the Technitium DNS API. For this, one should create a group which can only access the dashboard in "View" mode and nothing else. Then, create a dedicated user in that group and an access token for this user. All of this can be managed in the "Administration" tab of the DNS server's web interface.

## Run with Docker (recommended)

```bash
docker run --name technitium-exporter \
    -p 8080:8080 \
    -e 'TECHNITIUM_API_DNS_BASE_URL=...' \
    -e 'TECHNITIUM_API_DNS_TOKEN=...' \
    -e 'TECHNITIUM_API_DNS_LABEL=...' \
    ghcr.io/brioche-works/technitium-dns-prometheus-exporter:master
```

The metrics are then available at `http://127.0.0.1:8080/metrics`.

Here is a more complete example of a deployment alongside the actual DNS server using a compose file :

```yaml
networks:
  # This is used by the exporter to retrieve data from the DNS server
  internal:
    name: dns_internal_network
    driver: bridge
    internal: true
services:
  dns:
    image: technitium/dns-server:latest
    container_name: technitium_dns
    restart: unless-stopped
    networks:
      - internal
    ports:
      - "5380:5380/tcp" # DNS web console (HTTP)
      - "53:53/udp"     # DNS service over UDP
      - "53:53/tcp"     # DNS service over TCP
    environment:
      DNS_SERVER_DOMAIN: dns.example.com
    volumes:
      - "./dns:/etc/dns"
      - "./certs:/etc/certs:ro"
    sysctls:
      - net.ipv4.ip_local_port_range=1024 65000
    user: '1000:1000'
  exporter:
    image: ghcr.io/brioche-works/technitium-dns-prometheus-exporter:master
    container_name: technitium_dns_exporter
    restart: unless-stopped
    networks:
      - internal
    ports:
      - '8080:8080'
    environment:
      TECHNITIUM_API_DNS_BASE_URL: 'http://technitium_dns:5380/'
      TECHNITIUM_API_DNS_TOKEN: '...'
      TECHNITIUM_API_DNS_LABEL: 'dns'
    user: '1000:1000'
```

> [!NOTE]
> The Technitium DNS compose example above is very minimal. Before deploying your own instance, it might be nice to check the [example compose file](https://github.com/TechnitiumSoftware/DnsServer/blob/master/docker-compose.yml) and the [environment variables documentation](https://github.com/TechnitiumSoftware/DnsServer/blob/master/DockerEnvironmentVariables.md). If you forget to enable some features, you can always do it later via the UI.

### A note on environment variables

In order to enable monitoring several DNS servers with the same exporter, environment variables are managed in a special way. A server is defined by two environment variables :

- `TECHNITIUM_API_*_BASE_URL`: the URL at which the server can be accessed (without the API path)
- `TECHNITIUM_API_*_TOKEN`: the API token

The variable part represented by a `*` is a kind of identifier, it can only contain numbers, uppercase letters and underscores. In the metrics, it is exported in lowercase as the `server` label. For instance if one were to set `TECHNITIUM_API_MY_DNS_BASE_URL`/`TECHNITIUM_API_MY_DNS_TOKEN`, one would have metrics with the `server="my_dns"` label. One would be able to override the label via the `TECHNITIUM_API_MY_DNS_LABEL` environment variable. 

### Build the container locally

```bash
docker build . -t technitium-dns-exporter
```

## Run with NodeJS (dev)

> Note: so far, this has only be tested with node 18

First, we install the dependencies :

```bash
npm install
```

Then, we set the variables and run the exporter :

```bash
export TECHNITIUM_API_DNS_BASE_URL='...'
export TECHNITIUM_API_DNS_TOKEN='...'
npm run dev
```

## Dashboard integration

Enclosed with this repository is a [sample dashboard](grafana-dashboard.json) that uses most of the metrics from this exporter. Here is what it can look like :

![general section of the dashboard](images/grafana-1.png)

![blocking and result sections of the dashboard](images/grafana-2.png)

![resolving and caching sections of the dashboard](images/grafana-3.png)
