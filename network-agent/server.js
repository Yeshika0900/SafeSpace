import http from "node:http";
import os from "node:os";
import { execFile } from "node:child_process";

const PORT = 4174;

function readArp() {
    return new Promise((resolve, reject) => {

        execFile("arp", ["-a"], { timeout: 5000 }, (err, stdout) => {

            if (err) {
                return reject(err);
            }

            const devices = [];
            const seen = new Set();

            for (const line of stdout.split(/\r?\n/)) {

                const match = line.match(
                    /^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F:-]{17})\s+(\w+)\s*$/
                );

                if (!match) continue;

                const ip = match[1];
                const mac = match[2].toLowerCase();
                const firstOctet = Number(ip.split(".")[0]);

                // Remove multicast addresses
                if (firstOctet >= 224 && firstOctet <= 239) {
                    continue;
                }

                // Remove broadcast addresses
                if (
                    mac === "ff-ff-ff-ff-ff-ff" ||
                    mac === "ff:ff:ff:ff:ff:ff"
                ) {
                    continue;
                }

                // Avoid duplicate entries
                if (seen.has(ip)) continue;

                seen.add(ip);

                devices.push({
                    ip: ip,
                    mac: mac,
                    interface: "ARP table"
                });
            }

            resolve(devices);
        });
    });
}

const server = http.createServer(async (req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    if (
        req.method === "GET" &&
        req.url === "/api/network-devices"
    ) {

        try {

            const devices = await readArp();

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({

                hostname: os.hostname(),

                retrievedAt: new Date().toISOString(),

                devices: devices,

                source: "Local ARP cache"

            }));

        } catch (error) {

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({

                error: "Unable to read network devices",

                details: error.message

            }));
        }
    }

    res.writeHead(404);
    res.end("Not Found");

});

server.listen(PORT, "127.0.0.1", () => {

    console.log(
        `SafeSpace Network Helper running at http://localhost:${PORT}`
    );

});