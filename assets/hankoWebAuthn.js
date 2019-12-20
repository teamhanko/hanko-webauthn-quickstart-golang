(function (win) {
    win.hankoWebAuthn = {
        convertToBinary: data => {
            // convert from url-safe base64 to binary
            let decoded = window.atob(data.replace(/_/g, '/')
                .replace(/-/g, '+'));
            return Uint8Array.from(decoded, v => v.charCodeAt(0))
        },
        arrayBufferToBase64: buf => {
            // convert the base64 to url-safe base64
            const bytes = new Uint8Array(buf);
            const len = bytes.byteLength;
            let binary = "";
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            return window.btoa(binary).replace(/\//g, '_')
                .replace(/\+/g, '-')
        },
        convertHankoRequest: (requestStr, auth) => {
            // needs rework
            const req = JSON.parse(requestStr);
            if (auth) {
                req.userVerification = "preferred";
            } else {
                req.authenticatorSelection = {
                    authenticatorAttachment: "platform",
                    requireResidentKey: false,
                    userVerification: "preferred",
                };
            }
            req.challenge = win.hankoWebAuthn.convertToBinary(req.challenge);
            if (req.hasOwnProperty("user")) {
                req.user.id = win.hankoWebAuthn.convertToBinary(req.user.id);
            }
            if (req.hasOwnProperty("excludeCredentials")) {
                for (let i = 0; i < req.excludeCredentials.length; i++) {
                    req.excludeCredentials[i].id = win.hankoWebAuthn.convertToBinary(req.excludeCredentials[i].id)
                }
            }
            if (req.hasOwnProperty("allowCredentials")) {
                for (let i = 0; i < req.allowCredentials.length; i++) {
                    req.allowCredentials[i].id = win.hankoWebAuthn.convertToBinary(req.allowCredentials[i].id)
                }
            }
            return req
        },
        handleApiResponse: (response, authenticate) => {
            const fidoResp = response.response;
            const attestationObject = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.attestationObject);
            const clientDataJSON = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.clientDataJSON);
            const rawId = win.hankoWebAuthn.arrayBufferToBase64(response.rawId);
            const authenticatorData = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.authenticatorData);
            const signature = win.hankoWebAuthn.arrayBufferToBase64(fidoResp.signature);
            let assertion = {};
            if (authenticate) {
                assertion = {
                    clientDataJSON: clientDataJSON,
                    authenticatorData: authenticatorData,
                    signature: signature,
                }
            } else {
                assertion = {
                    attestationObject: attestationObject,
                    clientDataJSON: clientDataJSON,
                }
            }
            return {
                webAuthnResponse: {
                    id: response.id,
                    rawId: rawId,
                    type: response.type,
                    response: assertion
                },
                deviceKeyInfo: {
                    keyName: 'security key'
                }
            }
        },
        register: (request, successCb, errorCb) => {
            const req = win.hankoWebAuthn.convertHankoRequest(request, false);
            navigator.credentials.create({publicKey: req}).then(response => {
                const result = win.hankoWebAuthn.handleApiResponse(response, false);
                successCb(result)
            }).catch(e => {
                errorCb(e)
            });
        },
        authenticate: (request, successCb, errorCb) => {
            const req = win.hankoWebAuthn.convertHankoRequest(request, true);
            navigator.credentials.get({publicKey: req}).then(response => {
                const result = win.hankoWebAuthn.handleApiResponse(response, true);
                successCb(result)
            }).catch(e => {
                errorCb(e)
            });
        },
    }
})(window);