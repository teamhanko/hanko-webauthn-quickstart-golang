# Hanko WebAuthn Quickstart App

The example application demonstrates FIDO2/WebAuthn and how to utilize the Hanko Authentication API in a web application written in Go.

## Prerequisites

- Go 1.13+, when running from source or Docker if you going to try out the Docker container.
- an API URL of your Hanko Authentication instance, and an API Key ID/API secret pair in order to make authorized calls to the Hanko API:
    1. Go to the [Hanko Console](https://console.hanko.io)
    1. Log in or register an account
    1. Once signed in, create an organization. If you already created an organization, select the organization.
    1. Add a new relying party with the following properties:
        - Relying Party Name: choose any name you want
        - APP ID: **must** be `http://localhost` when using the sample application from a local environment. 
    1. Click "Add new Relying Party". Select the created relying party to get to the relying party dashboard.
    1. On the relying party dashboard, select "General Settings" and then click "Add" in the "API Keys" panel.
    This will generate an API Key and an API Key ID.  You should store the secret securely since it cannot be obtained once 
    you confirm and close the modal displayed after key generation. You will need the API Key ID/API Key pair to 
    configure the sample application (see [Configure Hanko Api Keys](#configure-hanko-api-keys)).
    1. On the dashboard also obtain the API URL.

## Running

### From Source

Configure the API URL, API key and secret for making authorized calls to the Hanko Authentication API by editing 
the `config.yml` file in the `config` directory:

1. Edit your API URL: `apiUrl:<YOUR_API_URL>`
2. Edit your API key ID: `apiKeyId:<YOUR_API_KEY_ID>`
3. Edit your API key: `apiKey:<YOUR_API_KEY>`

Clone the repository and run:

```
go run
``` 

### Using Docker

Clone the repository and run:
```
docker build -t hanko-webauthn-quickstart-app . 
docker run -p 3000:3000 -e APIURL=<YOUR_API_URL> -e APIKEYID=<YOUR_API_KEY_ID> -e APIKEY=<YOUR_API_KEY> --name hanko-webauthn-quickstart-app hanko-webauthn-quickstart-app
```

You can now go to https://localhost:3000/ and try out the WebAuthn flows.

For more information please see the [Hanko Docs](https://docs.hanko.io).
