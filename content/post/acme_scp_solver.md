---
title: "Solving Let's Encrypt Challenges with SCP for Limited Web Hosting"
path: "custom_scp_solver_lets_encrypt"
template: "custom_scp_solver_lets_encrypt.html"
date: 2025-06-18T01:53:34+08:00
lastmod: 20220251-06-18T01:53:34+08:00
tags: ["golang", "letsencrypt", "acme", "ssl", "certificates", "webhosting"]
categories: ["Development", "Security"]
---

## The Problem: Limited Domain Hosting Without API Access

If you've ever tried to set up SSL certificates with Let's Encrypt on a domain hosting provider that doesn't offer API access, you know the struggle. My situation was particularly challenging:

1. My domain is hosted with a provider that doesn't offer any API for automated certificate management
2. My web space is limited, making it difficult to run a full ACME client directly on the server
3. I needed to automate the certificate renewal process to avoid manual intervention every 90 days

The standard approach for Let's Encrypt validation is to place a specific challenge file in the `.well-known/acme-challenge/` directory of your website. But how do you do this when you can't run software directly on your hosting provider?

## Enter Lego-SCP-Solver

To solve this problem, I created a Go-based tool that leverages the excellent [lego ACME client library](https://github.com/go-acme/lego) with a custom challenge solver that uses SCP (Secure Copy Protocol) to upload the challenge files to my web server.

The tool works by:

1. Connecting to your web server via SSH
2. Creating the required `.well-known/acme-challenge/` directory
3. Uploading the challenge token file via SCP
4. Verifying the file is accessible via HTTP
5. Cleaning up after the challenge is complete

This approach allows me to run the certificate issuance process from my local machine or a CI/CD pipeline, without needing to install anything on the web server itself.

## How It Works

The core of the solution is a custom HTTP-01 challenge provider that implements the lego challenge interface. Here's a simplified version of how it works:

```go
// Present implements the challenge.Provider interface
func (s *SCPSolver) Present(domain, token, keyAuth string) error {
    // Connect to SSH
    if err := s.connect(); err != nil {
        return fmt.Errorf("SSH connection failed: %w", err)
    }
    defer s.sshClient.Close()

    // Create remote directory
    remotePath := s.webrootPath + "/.well-known/acme-challenge"
    if err := s.createRemoteDir(remotePath); err != nil {
        return fmt.Errorf("failed to create remote directory: %w", err)
    }

    // Upload challenge file
    remoteFile := remotePath + "/" + token
    if err := s.uploadFile(remoteFile, keyAuth); err != nil {
        return fmt.Errorf("failed to upload challenge file: %w", err)
    }

    // Set proper permissions for web server access
    if err := s.setPermissions(remotePath, remoteFile); err != nil {
        log.Printf("Warning: Failed to set permissions: %v", err)
    }

    return nil
}
```

When Let's Encrypt needs to validate domain ownership, this code:

1. Establishes an SSH connection to the web server
2. Creates the challenge directory if it doesn't exist
3. Uploads the challenge token with the correct content
4. Sets appropriate permissions so the web server can serve the file

After validation, a similar cleanup function removes the challenge file.

## Setting Up and Using the Tool

Using the tool is straightforward. You can either set environment variables:

```bash
export LEGO_SCP_HOST="your-server.com"
export LEGO_SCP_USER="your-username"
export LEGO_SCP_KEY_PATH="/path/to/your/ssh/private/key"
export LEGO_SCP_WEBROOT_PATH="/var/www/html"
export LEGO_SCP_EMAIL="your-email@example.com"
export LEGO_SCP_DOMAINS="example.com,www.example.com"
export LEGO_SCP_ACCOUNT_KEY="/path/to/account.key"
export LEGO_SCP_CERT_PATH="/path/to/certificates"
```

Or use command-line flags:

```bash
lego-scp-solver -e your-email@example.com -d example.com,www.example.com \
  --scp-host your-server.com --scp-user username --scp-key ~/.ssh/id_rsa \
  --scp-webroot /var/www/html --cert-path ./certificates
```

## Automating with GitHub Actions

To fully automate the certificate renewal process, I set up a GitHub Actions workflow that runs the tool on a schedule:

```yaml
name: Renew SSL Certificates

on:
  schedule:
    - cron: "0 0 1 * *" # Run on the 1st of every month
  workflow_dispatch: # Allow manual triggering

jobs:
  renew:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.21"

      - name: Setup SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

      - name: Run certificate renewal
        env:
          LEGO_SCP_HOST: ${{ secrets.SCP_HOST }}
          LEGO_SCP_USER: ${{ secrets.SCP_USER }}
          LEGO_SCP_KEY_PATH: ~/.ssh/id_rsa
          LEGO_SCP_WEBROOT_PATH: ${{ secrets.WEBROOT_PATH }}
          LEGO_SCP_EMAIL: ${{ secrets.ACME_EMAIL }}
          LEGO_SCP_DOMAINS: ${{ secrets.DOMAINS }}
          LEGO_SCP_ACCOUNT_KEY: account.key
        run: |
          go run .

      - name: Upload certificates
        uses: actions/upload-artifact@v3
        with:
          name: certificates
          path: ./*.crt
```

This workflow securely stores all sensitive information in GitHub Secrets and runs the certificate renewal process automatically.

## Benefits of This Approach

1. **No server-side installation required**: Works with any hosting provider that offers SSH/SCP access
2. **Fully automated**: Set it and forget it - certificates renew automatically
3. **Secure**: Uses SSH key authentication for secure file transfers
4. **Flexible**: Works with multiple domains and subdomains
5. **Lightweight**: Minimal dependencies and resource usage

## The Lego ACME Library: A Powerful Foundation

[Lego](https://github.com/go-acme/lego) is a Let's Encrypt client and ACME library written in Go. It provides a complete solution for obtaining, renewing, and revoking SSL certificates from Let's Encrypt and other ACME-compatible certificate authorities.

What makes Lego particularly powerful is its extensibility. It supports multiple challenge types (HTTP-01, DNS-01, TLS-ALPN-01) and comes with built-in providers for many popular DNS services and hosting platforms. However, its true strength lies in its ability to be extended with custom challenge solvers.

## The Easier Alternative: Using Supported DNS Providers

While my SCP solution works well for my specific constraints, I should mention that there's an easier path if you have the flexibility to choose your domain registrar or DNS provider. Lego has built-in support for [over 150 DNS providers](https://go-acme.github.io/lego/dns/), making certificate issuance much simpler if you use one of these services.

With DNS-01 validation through a supported provider, you can:

- Issue wildcard certificates (which isn't possible with HTTP validation)
- Validate domains without exposing your web server to the internet
- Automate the entire process without custom code
- Issue certificates even when port 80 is blocked

When using DNS-01 validation, Lego creates a TXT record at `_acme-challenge.yourdomain.com` that Let's Encrypt verifies. You can check this record yourself using nslookup:

```
$ nslookup -q=TXT _acme-challenge.yourdomain.com 8.8.8.8
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
_acme-challenge.yourdomain.com	text = "IyxgKAO2vD-GRuMQgJfDKI8zcJRZwjTkYOv_xgAQmq4"

Authoritative answers can be found from:
yourdomain.com	nameserver = ns1.example-dns.com.
yourdomain.com	nameserver = ns2.example-dns.com.
```

This TXT record contains the validation token that proves you control the domain.

If you're starting a new project or can migrate your DNS, consider using one of these supported providers:

- AWS Route 53
- Cloudflare
- DigitalOcean
- Google Cloud DNS
- Azure DNS
- OVH
- Namecheap
- And [many more](https://go-acme.github.io/lego/dns/)

With these providers, certificate issuance is as simple as:

```bash
lego --email you@example.com --domains example.com --dns provider-name --dns.resolvers 1.1.1.1 run
```

This approach eliminates the need for custom challenge solvers like my SCP solution. However, if you're stuck with a hosting provider that isn't on the list (as I was), then a custom solution like lego-scp-solver becomes necessary.

### Key Features of Lego

- Complete ACME protocol implementation
- Support for multiple challenge types
- Built-in providers for many DNS services
- Certificate management (obtain, renew, revoke)
- Library mode for integration into other Go applications
- Command-line tool for standalone use

## Writing a Custom Challenge Solver

One of the most powerful aspects of Lego is the ability to write custom challenge solvers. The [official documentation](https://go-acme.github.io/lego/usage/library/writing-a-challenge-solver/) provides a clear guide on how to do this.

To create a custom challenge solver, you need to implement the appropriate provider interface. For HTTP-01 challenges (like in my SCP solver), you implement the `challenge.Provider` interface, which requires two methods:

```go
type Provider interface {
    Present(domain, token, keyAuth string) error
    CleanUp(domain, token, keyAuth string) error
}
```

The `Present` method is called when the challenge needs to be set up, and `CleanUp` is called after the challenge is complete. This simple interface makes it easy to implement custom solutions for any hosting environment.

Here's a basic template for creating a custom HTTP-01 challenge solver:

```go
type MyCustomSolver struct {
    // Your configuration fields here
}

func NewMyCustomSolver(config YourConfig) *MyCustomSolver {
    return &MyCustomSolver{
        // Initialize with your config
    }
}

// Present implements the challenge.Provider interface
func (s *MyCustomSolver) Present(domain, token, keyAuth string) error {
    // 1. Create the challenge directory if needed
    // 2. Create the challenge file with keyAuth as content
    // 3. Make it accessible via HTTP
    return nil
}

// CleanUp implements the challenge.Provider interface
func (s *MyCustomSolver) CleanUp(domain, token, keyAuth string) error {
    // Remove the challenge file
    return nil
}

// Then in your main code:
func main() {
    // ... initialize lego client

    mySolver := NewMyCustomSolver(config)
    client.Challenge.SetHTTP01Provider(mySolver)

    // ... proceed with certificate request
}
```

This flexibility allowed me to create the SCP-based solver for my specific hosting environment constraints.

## Conclusion

If you're stuck with a web hosting provider that doesn't offer Let's Encrypt integration or API access, this tool might be just what you need. It bridges the gap between modern automated certificate management and traditional web hosting environments.

The power of Lego's extensible architecture makes it possible to solve unique challenges like limited web hosting environments. By implementing a custom challenge solver, I was able to automate certificate management even with the constraints of my hosting provider.

The full source code is available on [GitHub](https://github.com/SlashGordon/lego-scp-solver) under the MIT license. Feel free to use it, fork it, or contribute to make it even better!

Remember, everyone deserves free, automated SSL certificates - even if your hosting provider hasn't caught up with the times yet.
