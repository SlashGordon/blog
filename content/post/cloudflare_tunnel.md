---
title: "Mastering the Home Lab: Gitea & Jellyfin on Synology via Cloudflare Tunnel"
date: 2025-12-25
categories:
  - homelab
  - docker
  - cloudflare
tags:
  - gitea
  - jellyfin
  - cloudflare
  - synology
  - docker-compose
---

## Introduction

Self-hosting a private Git instance and a high-performance media server on a Synology NAS is the ultimate "power user" move. By leveraging Cloudflare Tunnels, we can expose these services to the internet without opening firewall ports, while keeping our internal traffic secure and locked down. This approach provides enterprise-grade security with zero-trust architecture, all while maintaining the convenience of remote access from anywhere in the world.

In this guide, we'll walk through setting up:
- **Gitea**: A lightweight, self-hosted Git service
- **Jellyfin**: An open-source media server for your personal library
- **Cloudflare Tunnel**: Secure access without port forwarding

## 1. The Architecture

Our setup relies on a single Cloudflare Tunnel container that acts as the secure gateway for all our services. Here's how it works:

- **Docker Bridge Network**: We use a dedicated network (`app_network`) that allows the tunnel container to communicate with Gitea and Jellyfin using container names as DNS entries.
- **Zero Port Forwarding**: All traffic flows through Cloudflare's global network, eliminating the need to expose your home IP or open router ports.
- **Service Isolation**: Each service runs in its own container with clearly defined networking boundaries.## 2. The Complete Docker Compose Configuration

This configuration orchestrates all three services: Gitea (Git server), Jellyfin (media server), and the Cloudflare Tunnel for secure external access.

**Save this as `docker-compose.yml` on your Synology:**

```yaml
version: "3.9"

services:
  # --- Gitea (Git Service) ---
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    restart: always
    networks:
      - app_network
    ports:
      - "3000:3000"   # Web UI
      - "2222:2222"   # SSH (use non-standard port to avoid conflicts)
    environment:
      - USER_UID=1026          # Match your Synology user UID
      - USER_GID=100           # Match your Synology user GID
      - GITEA__server__DOMAIN=gitea.yourdomain.com
      - GITEA__server__SSH_DOMAIN=git.yourdomain.com
      - GITEA__server__ROOT_URL=https://gitea.yourdomain.com/
      - GITEA__server__START_SSH_SERVER=true
      - GITEA__server__SSH_PORT=2222
    volumes:
      - /volume1/docker/gitea:/data

  # --- Jellyfin (Media Server) ---
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    networks:
      - app_network
    environment:
      - JELLYFIN_DATA_DIR=/config
      - NVIDIA_VISIBLE_DEVICES=all  # For NVIDIA GPU transcoding (optional)
    volumes:
      - /volume1/docker/jellyfin/config:/config
      - /volume1/media/video/:/media
    ports:
      - "8096:8096"

  # --- Cloudflare Tunnel ---
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: unified-tunnel
    restart: unless-stopped
    networks:
      - app_network
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${YOUR_TUNNEL_TOKEN}  # Replace with your actual token

networks:
  app_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.24.0.0/16
```

**Important Notes:**
- Replace `${YOUR_TUNNEL_TOKEN}` with your actual Cloudflare Tunnel token (obtain from the Cloudflare Zero Trust dashboard)
- Adjust `USER_UID` and `USER_GID` to match your Synology user (run `id <username>` via SSH to find these values)
- Update volume paths to match your Synology directory structure

## 3. Cloudflare Tunnel Configuration

To route external traffic to your services, configure the following in your **Cloudflare Zero Trust Dashboard** (under Networks > Connectors).

### Public Hostname Configuration

For each tunnel, you'll need to add Public Hostnames (application routes). Use the following configuration:

| Subdomain | Service Type | Internal URL | Notes |
|-----------|--------------|--------------|-------|
| `gitea.yourdomain.com` | HTTP | `http://gitea:3000` | Gitea Web UI |
| `git.yourdomain.com` | TCP | `tcp://gitea:2222` | Git SSH (required for `git push/pull`) |
| `jelly.yourdomain.com` | HTTP | `http://jellyfin:8096` | Jellyfin media library |
| `internal.yourdomain.com` | HTTPS | `https://192.168.50.2:5001` | Synology DSM (enable "No TLS Verify") |

**Why separate subdomains for Gitea?** Cloudflare Tunnels can only route one subdomain to one service/port combination. Since Gitea has two distinct services (Web UI on port 3000 and SSH on port 2222), we need separate subdomains: `gitea.yourdomain.com` for the web interface and `git.yourdomain.com` for SSH/Git operations.

**Critical Configuration Steps:**

1. **Create the Tunnel**: In the Cloudflare Zero Trust dashboard, create a new tunnel and copy the tunnel token
2. **Add Public Hostnames**: For each subdomain above, add a public hostname with the corresponding service type and URL
3. **TCP Service for SSH**: The `git.yourdomain.com` entry **must** use TCP type (not HTTP) to avoid "bad handshake" errors with Git SSH
4. **No TLS Verify**: For the Synology DSM entry, enable "No TLS Verify" since DSM uses a self-signed certificate## 4. Seamless Git SSH Access

The real "magic" happens when you configure your local machine to automatically proxy Git SSH connections through Cloudflare. This eliminates the need to manually start tunnels every time you want to push or pull code.

**Add this to your SSH config file** (`~/.ssh/config` on Mac/Linux, `C:\Users\<username>\.ssh\config` on Windows):

```ssh-config
Host git.yourdomain.com
    HostName %h
    User git
    Port 2222
    ProxyCommand cloudflared access tcp --hostname %h
```

**What this does:**
- Automatically routes all SSH connections to `git.yourdomain.com` through Cloudflare Access
- Uses `cloudflared` as a transparent proxy
- No manual tunnel setup required - just run `git clone git@git.yourdomain.com:username/repo.git`

**Prerequisites:**
- Install `cloudflared` on your local machine: [Cloudflare download page](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
- Authenticate once: `cloudflared access login`

**Troubleshooting:**
If you encounter connection issues, test the tunnel manually:
```bash
cloudflared access tcp --hostname git.yourdomain.com --url localhost:2222
```
This command will show detailed logs and help identify authentication or routing problems.

## 5. Jellyfin Performance & Hardware Transcoding

Since Jellyfin is running on your Synology NAS, optimizing performance is crucial for smooth playback, especially for high-resolution content.

### Direct Play vs. Transcoding

- **Direct Play**: When your client supports the media format natively, Jellyfin streams the file as-is with minimal CPU usage. This is ideal for most scenarios.
- **Transcoding**: When format conversion is needed (e.g., 4K to 1080p, or incompatible codecs), transcoding can be CPU-intensive.

### Enabling Hardware Acceleration

To enable hardware-accelerated transcoding on Synology:

1. **Open Jellyfin Dashboard**: Navigate to `jelly.yourdomain.com` and log in as admin
2. **Go to Transcoding Settings**: Dashboard → Playback → Transcoding
3. **Select Hardware Acceleration**:
   - **Intel NAS**: Choose "Intel QuickSync Video" (QSV)
   - **AMD NAS**: Choose "Video Acceleration API (VA-API)"
   - **NVIDIA GPU**: Choose "NVIDIA NVENC/NVDEC" (requires additional setup)

**Intel QuickSync** (most common for Synology):
- Supports H.264, HEVC (H.265), VP9, and AV1 codecs
- Can handle multiple 4K streams simultaneously with minimal CPU usage
- Available on most Synology NAS with Intel processors (J-series, Plus models, etc.)

### Verifying Hardware Acceleration

After enabling, play a media file and check:
1. Dashboard → Active Devices
2. Look for "Transcode Reason" - should show hardware method (e.g., "QSV")
3. Monitor CPU usage - should remain low during transcoding

**Pro Tip**: Enable "Prefer fMP4-HLS Media Container" in the Transcoding settings for better compatibility across different devices.

## 6. Security: Synology Firewall Configuration

Don't forget the final layer of security. Your Synology firewall needs to allow traffic from the Docker network to reach the services.

### Firewall Rules

In **DSM → Control Panel → Security → Firewall**:

1. **Create a new rule** (if firewall is enabled):
   - **Ports**: Allow `2222, 3000, 5001, 8096`
   - **Source IP**: `172.24.0.0` with netmask `255.240.0.0` (this covers the Docker subnet)
   - **Protocol**: TCP
   - **Action**: Allow

2. **Why this matters**: The Cloudflare Tunnel container needs to reach Gitea and Jellyfin. Since they're all on the Docker bridge network (`172.24.0.0/16`), this rule ensures internal Docker communication works properly.

### Additional Security Recommendations

- **Enable Cloudflare Access Policies**: Add email or identity provider authentication to your tunnels for an extra security layer
- **Regular Updates**: Keep Docker images updated (`docker-compose pull && docker-compose up -d`)
- **Monitor Logs**: Regularly check container logs for suspicious activity (`docker logs <container-name>`)
- **Disable DSM Auto-Blocker for Tunnel**: Add the Docker subnet to the allow list to prevent the tunnel from being blocked

### Advanced: Domain Security Rules

For an additional layer of protection, you can configure **Security Rules** in Cloudflare to restrict access based on IP addresses or geographic locations.

Navigate to your domain in Cloudflare Dashboard → **Security** → **Security rules** → **Custom rules** → **Edit custom rule**.

**Example: Restrict access to your home network only**

```
(not ip.src in {2001:0db8:c0de:cafe::/64} and http.host wildcard "gitea.yourdomain.com") 
or (http.host wildcard "jelly.yourdomain.com" and not ip.src in {2001:0db8:c0de:cafe::/64}) 
or (http.host wildcard "internal.yourdomain.com" and not ip.src in {2001:0db8:c0de:cafe::/64})
```

This rule blocks access to your services unless the request comes from your specified IPv6 subnet. Replace `2001:0db8:c0de:cafe::/64` with your actual home network prefix.

**Example: Block specific countries**

You can also block entire countries (e.g., to reduce automated attacks):

```
(ip.geoip.country in {"RU" "CN" "KP"}) and http.host wildcard "*.yourdomain.com"
```

This blocks traffic from Russia (RU), China (CN), and North Korea (KP). Adjust the country codes based on your needs.

**Pro Tip**: Combine both rules using `and`/`or` logic for granular control - for example, allow your home IP while blocking certain countries for all other traffic.

## Summary

You now have a fully functional, secure home lab setup featuring:

✅ **Gitea**: Private Git hosting with seamless SSH access  
✅ **Jellyfin**: High-performance media streaming with hardware transcoding  
✅ **Cloudflare Tunnel**: Enterprise-grade security without port forwarding  
✅ **Remote Access**: Access all services from anywhere with zero-trust security  

All of this runs on a single Synology NAS, protected by Cloudflare's global network, and accessible worldwide without exposing your home network.

### Next Steps

- **Set up automated backups** for your Gitea repositories and Jellyfin metadata
- **Configure Cloudflare Access policies** for additional authentication layers
- **Add more services** to your `docker-compose.yml` (e.g., Nextcloud, Bitwarden, Home Assistant)
- **Monitor resource usage** to ensure your NAS can handle the workload

Happy self-hosting! 🚀