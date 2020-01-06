(function (win) {
    win.hankoWebAuthn = {
        createCredentials: (request) => win.hankoWebAuthn._callNavigatorCredentials(request, false),
        getCredentials: (request) => win.hankoWebAuthn._callNavigatorCredentials(request, true),
        _callNavigatorCredentials: (requestRaw, authenticate) => new Promise(
            (resolve, reject) => {
                const request = JSON.parse(requestRaw);
                navigator.credentials[authenticate ? "get" : "create"]({publicKey: win.hankoWebAuthn._convertApiRequest(request, authenticate)})
                    .then(response => resolve(win.hankoWebAuthn._convertApiResponse(response, authenticate))).catch(reject)
            }
        ),
        // convert the base64 to url-safe base64
        _arrayBufferToBase64: buf => {
            const bytes = new Uint8Array(buf), len = bytes.byteLength;
            let binary = "";
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            return window.btoa(binary).replace(/\//g, '_').replace(/\+/g, '-')
        },
        // convert from url-safe base64 to binary
        _convertToBinary: data => Uint8Array.from(window.atob(data.replace(/_/g, '/').replace(/-/g, '+')), v => v.charCodeAt(0)),
        _convertApiRequest: (request, authenticate) => {
            // TODO: make it better
            if (authenticate) {
                request.userVerification = "preferred";
            } else {
                request.authenticatorSelection = {
                    authenticatorAttachment: "platform",
                    requireResidentKey: false,
                    userVerification: "preferred",
                };
            }
            request.challenge = win.hankoWebAuthn._convertToBinary(request.challenge);
            if (request.hasOwnProperty("user")) {
                request.user.id = win.hankoWebAuthn._convertToBinary(request.user.id);
            }
            if (request.hasOwnProperty("excludeCredentials")) {
                for (let i = 0; i < request.excludeCredentials.length; i++) {
                    request.excludeCredentials[i].id = win.hankoWebAuthn._convertToBinary(request.excludeCredentials[i].id)
                }
            }
            if (request.hasOwnProperty("allowCredentials")) {
                for (let i = 0; i < request.allowCredentials.length; i++) {
                    request.allowCredentials[i].id = win.hankoWebAuthn._convertToBinary(request.allowCredentials[i].id)
                }
            }
            return request
        },
        _convertApiResponse: (response, authenticate) => {
            // TODO: make it better
            const fidoResp = response.response, rawId = win.hankoWebAuthn._arrayBufferToBase64(response.rawId),
                assertion = {clientDataJSON: win.hankoWebAuthn._arrayBufferToBase64(fidoResp.clientDataJSON)};
            if (authenticate) {
                assertion.authenticatorData = win.hankoWebAuthn._arrayBufferToBase64(fidoResp.authenticatorData);
                assertion.signature = win.hankoWebAuthn._arrayBufferToBase64(fidoResp.signature);
            } else {
                assertion.attestationObject = win.hankoWebAuthn._arrayBufferToBase64(fidoResp.attestationObject)
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
        }
    }
})(window);