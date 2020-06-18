---
title: "Flashing Archer c6 with OpenWrt 19.07"
path: "openwrt_archer_c6"
template: "openwrt_archer_c6.html"
tags: ["openwrt", "Archer c6"]
categories: ["tutorial"]
---

Flashing OpenWrt through the OEM web interface is not always possible but we can use TFTP instead.

## Flash using TFTP recovery

For the next steps you need a Ubuntu 18.04 with a ethernet port.

```shell
sudo apt-get install tftpd-hpa
wget http://downloads.openwrt.org/releases/19.07.2/targets/ath79/generic/openwrt-19.07.2-ath79-generic-tplink_archer-c6-v2-squashfs-factory.bin
sudo mv openwrt-19.07.2-ath79-generic-tplink_archer-c6-v2-squashfs-factory.bin /var/lib/tftpboot/ArcherC6v2_tp_recovery.bin
sudo chown tftp:tftp /var/lib/tftpboot/ArcherC6v2_tp_recovery.bin
```

Now we have to edit the config file `/etc/default/tftpd-hpa`:


```
TFTP_USERNAME="tftp"
TFTP_DIRECTORY="/var/lib/tftpboot"
TFTP_ADDRESS=":69"
TFTP_OPTIONS="--secure --create"
```

With the following commands we start the flashing.

* `sudo systemctl restart tftpd-hpa`

* `sudo systemctl status tftpd-hpa`

* Set local ip to 192.168.0.66

* Restart Archer C6, press reset and wps button for 10 sec.

* Wait...