# Hanko WebAuthn Quickstart App
This Application demonstrates how you can use our Hanko Api to 
make your Golang application ready for WebAuthn usage.

## Prerequisites

- Go 1.13+
- an API Key ID/API Key pair in order to make authorized calls to the Hanko API. To get an API Key ID/API Key pair:
    1. Go to the [Hanko Console](https://console.hanko.io)
    2. Log in or register an account
    3. Once signed in, create an organization. If you already created an organization, select the organization.
    4. Add a new relying party with the following properties:
        - Relying Party Name: choose any name you want
        - APP ID: **must** be `http://localhost` when using the sample application from a local environment. 
    5. Click "Add new Relying Party". Select the created relying party to get to the relying party dashboard.
    6. On the relying party dashboard, select "General Settings" and then click "Add" in the "API Keys" panel.
    This will generate an API Key and an API Key ID.  You should store the secret securely since it cannot be obtained once 
    you confirm and close the modal displayed after key generation. You will need the API Key ID/API Key pair to 
    configure the sample application (see [Configure Hanko Api Keys](#configure-hanko-api-keys)).

## Running
### From Source
If you have go installed just clone this Repository and run
```
go run
``` 

### In Docker Container
Please Clone the repository and run
```
docker build -t hanko-webauthn-quickstart-app . 
docker run -p 3000:3000 --name hanko-webauthn-quickstart-app hanko-webauthn-quickstart-app
```

You can now got to https://localhost:3000/ and try out the WebAuthn Flows.

For more information please see the [Hanko Docs](https://docs.hanko.io)

### Configure Hanko API keys

You can configure the API key and secret for making authorized calls to the Hanko API either by editing the 
`config.yml` file in the `config` directory or, when running with Docker, by using environment variables.

#### Using properties file

1. `config.yml` file in the `config` directory
2. Edit your API key ID: `apiKeyId:<YOUR_API_KEY_ID>`
3. Edit your API key: `apiKey:<YOUR_API_KEY>`

### Using Docker

```
docker run -p 3000:3000 -e APIKEYID=<YOUR_API_KEY_ID> -e APIKEY=<YOUR_API_KEY> --name hanko-webauthn-quickstart-app hanko-webauthn-quickstart-app
```
