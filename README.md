# Comport Server

> Backend for comport apps (amr performance car flashing apps)

### Available commands:

```bash
# to run the app in developement
yarn dev

# to deploy the app to the server (see `.deployer/README.md` for more details)
yarn deploy

# to renew ssl certificates using certbot (Let's Encrypt)
# This command need to be run in the server (after deploying the app)
yarn renew-ssl
```

## Preparation after deploying the app:

> **Preparing Server:** This app uses ssl certificates stored in `/apps/data`, To automatically generate/renew certificates using Let's Encrypt: install `certbot` on the machine and run `yarn renew-ssl` in root directory of the app (this command will take care of the generation process and will copy certificate and chain to `/apps/data`)

> **Preparing Tools:** Make sure to recompile native executables found in `'resources/programs'` all files with .exe extension or with none should be native executables that need to be re-compiled for the target platform (some of the programs are included in this repo `comport-server-programs`); This need to be done only once after the initial deployment of the app.

---

# Step by Step Guides

## First Steps

Initially you need to clone github repository to your local storage and prepare the code:

1. Clone repository using `git clone <url to github repo>`
2. Open repo's / project's folder in CMD
3. Install node packages using `yarn`

> Make sure to install nodejs and yarn before run in previous steps, after installing node, install yarn using this command `npm install yarn -g`

## Pushing Updates

For the first time after cloning repository, you need to configure the deployer script by following detailed instrcution from this file `.deployer/README.md`, this configuration need to be done only once after cloning the repository.

Then to push changes only one command need to be executed:

```
yarn deploy
```
This command will push server app update to the *Develpment* channel, which is used by the *Flasher App* when runing in `Debug` mode.

To push update to the *Live/Production* channel run the following command:
```
yarn deploy --prod
```

The *Live/Production* channel is used by the live customers.

Nothing else is required to push the update, running this single command will automatically upload newest local code to the server and restart the app.


## Changing and/or adding new features

Check for detailed instruction in the `docs` folder

## Renewing SSL Certificate

1. SSH into the server
2. Navigate to app's directory
    (cmd: `cd /apps/comport-server`)
3. run command `yarn renew-ssl` (sometimes this command stucks, if it gives error or it does not finish with 'restarting comport-server' message after a while just run the command again)

> - The `yarn renew-ssl` commands execute a script that uses `Let's Encrypt`'s free ceritficate and place them in the correct locations for the comport-server to use.
> - Let's Encrypt's certificate typically expires after 3 months, the renewing script must be run before the expiration of certificate to avoid downtime

> **IMPORTANT:** certbot program must be installed on the server/system