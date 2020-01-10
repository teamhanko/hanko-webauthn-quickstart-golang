# Hanko WebAuthn Quickstart App
This Application demonstrates how you can use our Hanko Api to 
make your Golang application ready for WebAuthn usage.

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
