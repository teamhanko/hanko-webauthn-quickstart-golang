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
                creationOptions.user.id = win.hankoWebAuthn._encode(options.user.id);
                creationOptions.challenge = win.hankoWebAuthn._encode(options.challenge);
                creationOptions.pubKeyCredParams = options.pubKeyCredParams;
                creationOptions.timeout = options.timeout || creationOptions.timeout;
                if (options.hasOwnProperty("excludeCredentials")) {
                    options.excludeCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
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
                            clientDataJSON: win.hankoWebAuthn._decode(resp.clientDataJSON),
                            attestationObject: win.hankoWebAuthn._decode(resp.attestationObject)
                        };
                        resolve(win.hankoWebAuthn._bakeCredentialRequest(assertion, response))
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
                requestOptions.challenge = win.hankoWebAuthn._encode(options.challenge);
                requestOptions.timeout = options.timeout || requestOptions.timeout;
                requestOptions.rpId = options.rpId;
                if (options.hasOwnProperty("allowCredentials")) {
                    options.allowCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
                        requestOptions.allowCredentials.push(publicKeyCredential);
                    });
                }
                if (options.hasOwnProperty("extensions")) {
                    requestOptions.extensions = options.extensions;
                }
                navigator.credentials.get({publicKey: requestOptions})
                    .then(response => {
                        const resp = response.response, assertion = {
                            clientDataJSON: win.hankoWebAuthn._decode(resp.clientDataJSON),
                            authenticatorData: win.hankoWebAuthn._decode(resp.authenticatorData),
                            signature: win.hankoWebAuthn._decode(resp.signature)
                        };
                        resolve(win.hankoWebAuthn._bakeCredentialRequest(assertion, response))
                    })
                    .catch(reject)
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
        },

        _bakeCredentialRequest: (assertion, response) => {
            return {
                webAuthnResponse: {
                    id: response.id,
                    rawId: win.hankoWebAuthn._decode(response.rawId),
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