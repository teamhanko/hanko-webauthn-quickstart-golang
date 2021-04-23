(function (win, hankoWebAuthn, mustache, jsonViewer) {
    win.app = {
        // elements stores the dynamically controlled html elements
        elements: {},

        // initializationResponse stores the initialization response of either a registration or an
        // authentication request
        initializationResponse: {},

        // endpoints of the example api
        endpoints: {
            "initialize_registration": "/registration_initialize",
            "finalize_registration": "/registration_finalize",
            "initialize_authentication": "/authentication_initialize",
            "finalize_authentication": "/authentication_finalize",
            "credentials": "/credentials",
        },

        // requestHeader when fetching the example api
        requestHeader: {"Content-Type": "application/json"},

        // run initially renders the upper part of the page with the webauthn demonstration and the lower part with the
        // list of credentials if there are any
        run: () => win.app._onDocumentReady(() => {
            win.app._referenceElements()
            win.app.renderRegistration()
            win.app.renderCredentials()
        }),

        // renderRegistration renders the registration page
        renderRegistration: () => {
            win.app._renderWebauthnDemoContainer("registration-template")
        },

        // renderAuthentication renders the authentication page
        renderAuthentication: () => {
            win.app._renderWebauthnDemoContainer("authentication-template")
        },

        // renderCredentials gets and renders a list of credentials
        renderCredentials: () => {
            win.app._request(win.app.endpoints["credentials"], "GET", null, response => {
                win.app._renderCredentialsContainer("credentials-template",
                    {credentials: response, hasCredentials: response !== null && response.length > 0})
            })
        },


        // renderCredential gets and renders a single credential
        renderCredential: credentialId => {
            const url = win.app.endpoints["credentials"] + "/" + credentialId
            win.app._request(url, "GET", null, response => {
                win.app._renderCredentialsContainer("credential-template", response)
            })
        },

        // deleteCredential fetches the api to delete the given credentialId and renders the list of
        // credentials on success
        deleteCredential: credentialId => {
            const url = win.app.endpoints["credentials"] + "/" + credentialId
            win.app._request(url, "DELETE", null, () => win.app.renderCredentials())
        },

        // initializeRegistration fetches the endpoint which invokes the registration and displays the response in the
        // ui (left side). the response is also used to sign the request in the finalization step
        initializeRegistration: event => {
            const data = new FormData(win.app.elements["registration-form"])
            const params = new URLSearchParams(data)
            const url = win.app.endpoints.initialize_registration + "?" + params.toString()
            win.app._initializeRequest(url, response => {
                win.app.initializationResponse = response // to be used in the finalization step
                win.app.elements["initialize-response"].append(win.app._formatJson(response))
            })
        },

        // finalizeRegistration signs the registration request using the webauthn api and sends the result to the
        // finalization endpoint. displays the response in the ui (right side)
        finalizeRegistration: () => {
            const url = win.app.endpoints.finalize_registration
            hankoWebAuthn.create(win.app.initializationResponse)
                .then(credential => win.app._finalizeRequest(url, credential, response => {
                    win.app.elements["finalize-response"].append(win.app._formatJson(response))
                    win.app.renderCredentials()
                })).catch(win.app._showWebauthnError)
        },

        // initializeAuthentication fetches the endpoint which invokes the authentication and displays the response
        // in the ui (left side). the response is also used to sign the request in the finalization step
        initializeAuthentication: () => {
            const data = new FormData(win.app.elements["authentication-form"])
            const params = new URLSearchParams(data)
            const url = win.app.endpoints.initialize_authentication + "?" + params.toString()
            win.app._initializeRequest(url, response => {
                win.app.initializationResponse = response // to be used in the finalization step
                win.app.elements["initialize-response"].append(win.app._formatJson(response))
            })
        },

        // finalizeAuthentication signs the authentication request using the webauthn api and sends the result to the
        // finalization endpoint. displays the response in the ui (right side)
        finalizeAuthentication: () => {
            const url = win.app.endpoints.finalize_authentication
            hankoWebAuthn.get(win.app.initializationResponse)
                .then(credential => win.app._finalizeRequest(url, credential, response => {
                    win.app.elements["finalize-response"].append(win.app._formatJson(response))
                })).catch(win.app._showWebauthnError)
        },

        // _renderWebauthnDemoContainer renders the content of the upper part of the page
        _renderWebauthnDemoContainer: templateElementId => {
            win.app.elements["error-text"].innerText = ""
            win.app._render("webauthn-demo-container", templateElementId,
                {}, ["teaser-partial"])
        },

        // _renderCredentialsContainer renders the content of the lower part of the page
        _renderCredentialsContainer: (templateElementId, data) => {
            win.app._render("credentials-container", templateElementId, data, [])
        },

        // _render renders into targetElementId the mustache template with the specified
        // templateElementId and bakes in the data. the partial parameter contains a list of elementIds of mustache
        // templates to be used as partials. the partials can then be included to a mustache template by using
        // the "{{>my-partial}}" syntax while "my-partial" is the id of the element which contains the partial
        _render: (targetElementId, templateElementId, data, partials) => {
            const p = partials.reduce((acc, partialId) =>
                ({...acc, [partialId]: win.app.elements[partialId].innerHTML}), {});
            data["formatDate"] = win.app._formatDate
            win.app.elements[targetElementId].innerHTML
                = mustache.render(win.app.elements[templateElementId].innerHTML, data, p)
            win.app._referenceElements()
        },

        // _formatDate used within mustache templates to format time strings,
        // e.g. "{{#formatDate}}2021-03-17T13:04:30.106345Z{{/formatDate}}"
        _formatDate: () => (str, render) => {
            const dt = new Date(render(str))
            return dt.toLocaleDateString(undefined, {localeMatcher: "best fit"})
                + " " + dt.toLocaleTimeString(undefined, {localeMatcher: "best fit"})
        },

        // _initializeRequest resets the necessary ui elements and fetches the example api to initialize
        // a new registration or authentication
        _initializeRequest: (endpoint, cb) => {
            ["initialize-response", "finalize-response", "error-text"]
                .forEach(elementId => win.app.elements[elementId].innerText = "")
            win.app._request(endpoint, "POST", null, response => cb(response))
        },

        // _initializeRequest resets the necessary ui elements and fetches the example api to finalize
        // a registration or authentication
        _finalizeRequest: (endpoint, credential, cb) => {
            ["finalize-response", "error-text"].forEach(elementId => win.app.elements[elementId].innerText = "")
            win.app._request(endpoint, "POST", JSON.stringify(credential), response => cb(response))
        },

        // _request wraps the fetch method and displays the error when something went wrong
        _request: (endpoint, method, body, cb) => {
            fetch(endpoint, {method: method, headers: win.app.requestHeader, body: body}).then(response => {
                if (response.status === 200) {
                    response.json().then(cb).catch(win.app._showServerError)
                } else {
                    response.json()
                        .then(response => win.app._showServerError(response.error))
                        .catch(win.app._showServerError)
                }
            }).catch(win.app._showServerError)
        },

        // _referenceElements stores references of the element that are dynamically controlled
        // to the elements property
        _referenceElements: () => [
            // template and layout elements
            "teaser-partial", "registration-template", "authentication-template", "credentials-template",
            "credential-template", "credentials-container", "webauthn-demo-container", "error-text",

            // elements used for the webauthn demonstration
            "registration-form", "authentication-form", "initialize-response", "finalize-response",
        ].forEach(elementId => win.app.elements[elementId] = document.getElementById(elementId)),

        // _formatJson takes any javascript object and converts it to pretty printed html, returns a html node.
        _formatJson: data => {
            const j = new jsonViewer()
            j.showJSON(data, -1, 2)
            return j.getContainer()
        },

        // _showError shows the error to the user.
        _showError: error => win.app.elements["error-text"].innerText = error,

        // _showServerError shows the server error to the user.
        _showServerError: error => win.app._showError("server error: " + error),

        // _showWebauthnError shows the webauthn api error to the user.
        _showWebauthnError: error => win.app._showError("webauthn api error: " + error),

        // _onDocumentReady calls fn when document has been loaded
        _onDocumentReady: fn => {
            if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(fn, 1);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }
    }
})(window, hankoWebAuthn, Mustache, JSONViewer);
