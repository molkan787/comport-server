# Comport Server App Deployer
This script is used to deploy the app to the server (upload new code, install node modules, and restart the app via pm2)

### **Before running the script:**
Create a file `config.json` (inside `'.deployer'` directory) with the following structure:
```
{
    "SSH": {
        "ServerIp": "xx.xx.xx.xx",
        "Username": "xxxx",
        "Password": "xxxx"
    },
    "UploadDir": "/home/comport",
    "AppDir": {
        "Prod": "/apps/comport-server",
        "Dev": "/apps/comport-server-dev"
    }
}
```

Example config:
```
{
    "SSH": {
        "ServerIp": "120.60.60.30",
        "Username": "comport",
        "Password": "password123"
    },
    "UploadDir": "/home/comport",
    "AppDir": {
        "Prod": "/apps/comport-server",
        "Dev": "/apps/comport-server-dev"
    }
}
```

Where the config is:\
`SSH`: The server ip and ssh credential (linux user)\
`AppDir`: The absolute path where the application is or should be placed (separatly for production & developement mode)\
`UploadDir`: An absolute path to a directory with read/write access to use temporary for uploading files.

> Note: `AppDir` & `UploadDir` are good as they are in the example, no need to change them, the only information you need to supply are the server's info (`SSH` config section)

### **Running the script:**
Simply execute `yarn deploy` in the root directory of the app,
or `yarn deploy --prod` for production mode

*Note: The server must have `nodejs`, `yarn`, `pm2` and `python3.9` installed*\
*Python must be available thru this command `'python3.9'`*