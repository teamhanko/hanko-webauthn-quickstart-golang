(function (win) {
    win.hankoWebAuthn = {
        convertToBinary: data => {
            // convert from url-safe base64 to binary
            let decoded = window.atob(data.replace(/_/g, '/')
                .replace(/-/g, '+'))[Symbol.iterator];
            return Uint8Array.from(decoded, v => v.charCodeAt(0))
        },
        arrayBufferToBase64: buf => {
            const bytes = new Uint8Array(buf);
            const len = bytes.byteLength;
            let binary = "";
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            // convert the base64 to url-safe base64
            return window.btoa(binary).replace(/\//g, '_')
                .replace(/\+/g, '-')
        },
        convertHankoRequest: requestStr => {
            const req = JSON.parse(requestStr); // parse the request because it is a string
            req.challenge = win.hankoWebAuthn.convertToBinary(req.challenge); // convert challenge to byte array
            req.user.id = win.hankoWebAuthn.convertToBinary(req.user.id); // convert user.id to byte array
            for (let i = 0; i < req.excludeCredentials.length; i++) {
                req.excludeCredentials[i].id = convertToBinary(req.excludeCredentials[i].id) // convert excluded key ids to byte array
            }
            return req
        },
        handleApiResponse: (response, addSignature) => {
            const fidoResp = response.response;
            const attestationObject = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.attestationObject);
            const clientDataJSON = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.clientDataJSON);
            const rawId = win.hankoWebAuthn.arrayBufferToBase64(response.rawId);
            const result = {
                webAuthnResponse: {
                    id: response.id,
                    rawId: rawId,
                    type: response.type,
                    response: {
                        attestationObject: attestationObject,
                        clientDataJSON: clientDataJSON,
                    }
                },
                deviceKeyInfo: {
                    keyName: 'security key'
                }
            };
            if (addSignature) {
                result.webAuthnResponse.response.signature =
                    win.hankoWebAuthn.arrayBufferToBase64(fidoResp.signature)
            }
            return result
        },
        register: (request, successCb, errorCb) => {
            const req = win.hankoWebAuthn.convertHankoRequest(request);
            console.log(request, req);
            navigator.credentials.create({publicKey: req}).then(response => {
                const result = win.hankoWebAuthn.handleApiResponse(response, false);
                successCb(result)
            }).catch(e => {
                errorCb(e)
            });
        },
        authenticate: (request, successCb, errorCb) => {
            const req = win.hankoWebAuthn.convertHankoRequest(request);
            navigator.credentials.get({publicKey: req}).then(response => {
                const result = win.hankoWebAuthn.handleApiResponse(response, true);
                successCb(result)
            }).catch(e => {
                errorCb(e)
            });
        },
    }
})(window);