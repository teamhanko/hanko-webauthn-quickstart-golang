(function (win) {
    win.hankoWebAuthn = {

        createCredentials: (createOptionsString) => new Promise(
            (resolve, reject) => {
                const opts = {
                    rp: {},               // required
                    user: {},             // required
                    challenge: undefined, // required
                    pubKeyCredParams: {}, // required
                    timeout: 9000,
                    excludeCredentials: [],
                    authenticatorSelection: {
                        requireResidentKey: false,
                        userVerification: "preferred",
                    },
                    attestation: "none",
                    extensions: {}
                }, createOptions = JSON.parse(createOptionsString);

                opts.rp = createOptions.rp;
                opts.user = createOptions.user;
                opts.user.id = win.hankoWebAuthn._encode(createOptions.user.id);
                opts.challenge = win.hankoWebAuthn._encode(createOptions.challenge);
                opts.pubKeyCredParams = createOptions.pubKeyCredParams;
                opts.timeout = createOptions.timeout || opts.timeout;

                if (createOptions.hasOwnProperty("excludeCredentials")) {
                    createOptions.excludeCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
                        opts.excludeCredentials.push(publicKeyCredential);
                    });
                }

                opts.attestation = createOptions.attestation || opts.attestation;

                if (createOptions.hasOwnProperty("extensions")) {
                    opts.extensions = createOptions.extensions;
                }

                navigator.credentials.create({publicKey: opts})
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

        getCredentials: (requestOptionsString) => new Promise(
            (resolve, reject) => {
                const opts = {
                    challenge: undefined, // required
                    timeout: 9000,
                    rpId: undefined,
                    allowCredentials: [],
                    userVerification: "preferred",
                    extensions: {}
                }, requestOptions = JSON.parse(requestOptionsString);

                opts.challenge = win.hankoWebAuthn._encode(requestOptions.challenge);
                opts.timeout = requestOptions.timeout || opts.timeout;
                opts.rpId = requestOptions.rpId;

                if (requestOptions.hasOwnProperty("allowCredentials")) {
                    requestOptions.allowCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoWebAuthn._encode(publicKeyCredential.id);
                        opts.allowCredentials.push(publicKeyCredential);
                    });
                }

                if (requestOptions.hasOwnProperty("extensions")) {
                    opts.extensions = requestOptions.extensions;
                }

                navigator.credentials.get({publicKey: opts})
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