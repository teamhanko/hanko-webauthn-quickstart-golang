(function (win) {
    win.hankoWebAuthn = {

        createCredentials: (createOptionsString) => new Promise(
            (resolve, reject) => {
                const defaults = {
                    timeout: 9000,
                    authenticatorSelection: {
                        requireResidentKey: false,
                        userVerification: "preferred",
                    },
                    attestation: "none",
                }, createOptions = JSON.parse(createOptionsString);

                createOptions.user.id = win.hankoWebAuthn._encode(createOptions.user.id);
                createOptions.challenge = win.hankoWebAuthn._encode(createOptions.challenge);
                createOptions.timeout = createOptions.timeout || defaults.timeout;
                createOptions.attestation = createOptions.attestation || defaults.attestation;

                if (createOptions.hasOwnProperty("excludeCredentials")) {
                    createOptions.excludeCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
                    });
                }

                navigator.credentials.create({publicKey: createOptions}).then(response => {
                    resolve({
                        webAuthnResponse: {
                            id: response.id,
                            rawId: win.hankoWebAuthn._decode(response.rawId),
                            type: response.type,
                            response: {
                                clientDataJSON: win.hankoWebAuthn._decode(response.response.clientDataJSON),
                                attestationObject: win.hankoWebAuthn._decode(response.response.attestationObject)
                            }
                        },
                        deviceKeyInfo: {
                            keyName: 'security key'
                        }
                    })
                }).catch(reject)
            }
        ),

        getCredentials: (requestOptionsString) => new Promise(
            (resolve, reject) => {
                const defaults = {
                    timeout: 9000,
                    userVerification: "preferred",
                }, requestOptions = JSON.parse(requestOptionsString);

                requestOptions.challenge = win.hankoWebAuthn._encode(requestOptions.challenge);
                requestOptions.timeout = requestOptions.timeout || defaults.timeout;
                requestOptions.userVerification = defaults.userVerification;

                if (requestOptions.hasOwnProperty("allowCredentials")) {
                    requestOptions.allowCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
                    });
                }

                navigator.credentials.get({publicKey: requestOptions}).then(response => {
                    resolve({
                        webAuthnResponse: {
                            id: response.id,
                            rawId: win.hankoWebAuthn._decode(response.rawId),
                            type: response.type,
                            response: {
                                clientDataJSON: win.hankoWebAuthn._decode(response.response.clientDataJSON),
                                authenticatorData: win.hankoWebAuthn._decode(response.response.authenticatorData),
                                signature: win.hankoWebAuthn._decode(response.response.signature)
                            }
                        },
                        deviceKeyInfo: {
                            keyName: 'security key'
                        }
                    })
                }).catch(reject)
            }
        ),

        _decode: buffer => {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            bytes.forEach(chr => binary += String.fromCharCode(chr));
            let str = window.btoa(binary);
            return str.replace(/\//g, '_').replace(/\+/g, '-')
        },

        _encode: str => {
            const dec = window.atob(str.replace(/_/g, '/').replace(/-/g, '+'));
            return Uint8Array.from(dec, v => v.charCodeAt(0))
        }

    }
})(window);