---
title: "Isolate FritzBox network from OpenWrt guest WiFi"
path: "openwrt_archer_c6"
template: "openwrt_archer_c6.html"
date: 2020-06-18T01:53:34+08:00
lastmod: 2020-06-18T01:53:34+08:00
tags: ["openwrt", "iptables", "FritzBox"]
categories: ["tutorial"]
---

Some months ago I configured a OpenWrt WiFi router behind a Fritz!Box.
A friend of mine told me that he is able to connect to other network clients outside of the OpenWrt guest WiFi.

The behavior is quite clear after a minute of reflection. The Fritz!Box is connected to the WAN port of the OpenWrt router ;)
<!--more-->

## firewall configuration

With the following zone configuration I was able to block the traffic between the FritzBox and the OpenWrt network.

Edit `nano /etc/config/firewall`

```
config zone
	option name 'public'
	option forward 'REJECT'
	option output 'ACCEPT'
	option input 'REJECT'
	option network 'public'

config forwarding
	option src 'public'
	option dest 'wan'

config rule
	option src 'public'
	option src_port '67-68'
	option dest_port '67-68'
	option proto 'udp'
	option target 'ACCEPT'
	option name 'Allow DHCP request'

config rule
	option src 'public'
	option dest_port '53'
	option proto 'tcpudp'
	option target 'ACCEPT'
	option name 'Allow DNS Queries'

config rule
	option src 'public'
	option name 'Deny FritzBox Network'
	option dest 'wan'
	list dest_ip '192.168.178.0/24'
	option target 'REJECT'
	list proto 'all'
	option family 'ipv4'

config rule
	option src 'public'
	option dest 'lan'
	option name 'Deny Guest on LAN'
	option proto 'all'
	option target 'DROP'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN http'
	option proto 'tcp'
	option dest_port '80'


config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN https'
	option proto 'tcp'
	option dest_port '443'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN pop3'
	option proto 'tcp'
	option dest_port '110'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN pop3s'
	option proto 'tcp'
	option dest_port '995'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN imap'
	option proto 'tcp'
	option dest_port '143'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN imaps'
	option proto 'tcp'
	option dest_port '993'

config rule
	option target 'ACCEPT'
	option src 'public'
	option dest 'wan'
	option name 'Allow Guest on WAN smtp'
	option proto 'tcp'
	option dest_port '587'

config rule
	option src 'public'
	option dest 'wan'
	option name 'Deny Guest on WAN'
	option proto 'all'
	option target 'DROP'
```