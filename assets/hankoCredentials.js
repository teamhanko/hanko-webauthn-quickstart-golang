(function (win) {
    win.hankoCredentials = {
        /*
        * @param {{createOptionsString: (string)}=} param1
        *   num: The number of times to do something.
        *   str: A string to do stuff to.
        */
        create: (createOptionsString) => new Promise(
            (resolve, reject) => {
                const createOptions = JSON.parse(createOptionsString);

                createOptions.user.id = win.hankoCredentials._encode(createOptions.user.id);
                createOptions.challenge = win.hankoCredentials._encode(createOptions.challenge);
                createOptions.attestation = createOptions.attestation || "none";

                if (createOptions.hasOwnProperty("excludeCredentials")) {
                    createOptions.excludeCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoCredentials._encode(publicKeyCredential.id);
                    });
                }

                navigator.credentials.create({publicKey: createOptions}).then(response => {
                    resolve({
                        webAuthnResponse: {
                            id: response.id,
                            rawId: win.hankoCredentials._decode(response.rawId),
                            type: response.type,
                            response: {
                                clientDataJSON: win.hankoCredentials._decode(response.response.clientDataJSON),
                                attestationObject: win.hankoCredentials._decode(response.response.attestationObject)
                            }
                        },
                        deviceKeyInfo: {
                            keyName: 'security key'
                        }
                    })
                }).catch(reject)
            }
        ),

        get: (requestOptionsString) => new Promise(
            (resolve, reject) => {
                const requestOptions = JSON.parse(requestOptionsString);

                requestOptions.challenge = win.hankoCredentials._encode(requestOptions.challenge);
                requestOptions.userVerification = requestOptions.userVerification || "preferred";

                if (requestOptions.hasOwnProperty("allowCredentials")) {
                    requestOptions.allowCredentials.forEach((publicKeyCredential) => {
                        publicKeyCredential.id = win.hankoCredentials._encode(publicKeyCredential.id);
                    });
                }

                navigator.credentials.get({publicKey: requestOptions}).then(response => {
                    resolve({
                        webAuthnResponse: {
                            id: response.id,
                            rawId: win.hankoCredentials._decode(response.rawId),
                            type: response.type,
                            response: {
                                clientDataJSON: win.hankoCredentials._decode(response.response.clientDataJSON),
                                authenticatorData: win.hankoCredentials._decode(response.response.authenticatorData),
                                signature: win.hankoCredentials._decode(response.response.signature)
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
            let str = win.btoa(binary);
            return str.replace(/\//g, '_').replace(/\+/g, '-')
        },

        _encode: str => {
            const dec = win.atob(str.replace(/_/g, '/').replace(/-/g, '+'));
            return Uint8Array.from(dec, v => v.charCodeAt(0))
        }

    }
})(window);