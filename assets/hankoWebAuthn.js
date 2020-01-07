(function (win) {
    win.hankoWebAuthn = {

        createCredentials: (publicKeyOptions) => new Promise(
            (resolve, reject) => {
                const creationOptions = {
                    rp: {},               // required
                    user: {},             // required
                    challenge: undefined, // required
                    pubKeyCredParams: {}, // required
                    timeout: 9000,
                    excludeCredentials: [],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        requireResidentKey: false,
                        userVerification: "preferred",
                    },
                    attestation: "none",
                    extensions: {}
                }, options = JSON.parse(publicKeyOptions);
                creationOptions.rp = options.rp;
                creationOptions.user = options.user;
                creationOptions.user.id = win.hankoWebAuthn._convertToBinary(options.user.id);
                creationOptions.challenge = win.hankoWebAuthn._convertToBinary(options.challenge);
                creationOptions.pubKeyCredParams = options.pubKeyCredParams;
                creationOptions.timeout = options.timeout || creationOptions.timeout;
                if (options.hasOwnProperty("excludeCredentials")) {
                    options.excludeCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._convertToBinary(publicKeyCredential.id);
                        creationOptions.excludeCredentials.push(publicKeyCredential);
                    });
                }
                creationOptions.attestation = options.attestation || creationOptions.attestation;
                if (options.hasOwnProperty("extensions")) {
                    creationOptions.extensions = options.extensions;
                }
                navigator.credentials.create({publicKey: creationOptions})
                    .then(response => {
                        const resp = response.response, assertion = {
                            clientDataJSON: win.hankoWebAuthn._arrayBufferToBase64(resp.clientDataJSON),
                            attestationObject: win.hankoWebAuthn._arrayBufferToBase64(resp.attestationObject)
                        };
                        resolve(win.hankoWebAuthn._bakeHankoCredentialRequest(assertion, response))
                    })
                    .catch(reject)
            }
        ),

        getCredentials: (publicKeyOptions) => new Promise(
            (resolve, reject) => {
                const requestOptions = {
                    challenge: undefined, // required
                    timeout: 9000,
                    rpId: undefined,
                    allowCredentials: [],
                    userVerification: "preferred",
                    extensions: {}
                }, options = JSON.parse(publicKeyOptions);
                requestOptions.challenge = win.hankoWebAuthn._convertToBinary(options.challenge);
                requestOptions.timeout = options.timeout || requestOptions.timeout;
                requestOptions.rpId = options.rpId;
                if (options.hasOwnProperty("allowCredentials")) {
                    options.allowCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._convertToBinary(publicKeyCredential.id);
                        requestOptions.allowCredentials.push(publicKeyCredential);

                    });
                }
                if (options.hasOwnProperty("extensions")) {
                    requestOptions.extensions = options.extensions;
                }
                navigator.credentials.get({publicKey: requestOptions})
                    .then(response => {
                        const resp = response.response, assertion = {
                            clientDataJSON: win.hankoWebAuthn._arrayBufferToBase64(resp.clientDataJSON),
                            authenticatorData: win.hankoWebAuthn._arrayBufferToBase64(resp.authenticatorData),
                            signature: win.hankoWebAuthn._arrayBufferToBase64(resp.signature)
                        };
                        resolve(win.hankoWebAuthn._bakeHankoCredentialRequest(assertion, response))
                    })
                    .catch(reject)
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

        _bakeHankoCredentialRequest: (assertion, response) => {
            return {
                webAuthnResponse: {
                    id: response.id,
                    rawId: win.hankoWebAuthn._arrayBufferToBase64(response.rawId),
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