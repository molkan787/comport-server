module.exports = {
    apps: [
        {
            name: "comport-server-dev",
            cwd: '/apps/comport-server-dev',
            script: "./index.js",
            env: {
                WINEARCH: "win32",
                WINEPREFIX: "/home/comport/.wine32",
            },
        },
        {
            name: "comport-server",
            cwd: '/apps/comport-server',
            script: "./index.js",
            env: {
                WINEARCH: "win32",
                WINEPREFIX: "/home/comport/.wine32",
            },
        }
    ]
}