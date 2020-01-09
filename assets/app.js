(function (win, hankoCredentials) {
    win.app = {

        // Store DOM elements.
        elements: {},

        // Store Hanko API response we are getting forwarded from the example API.
        hankoApiResponse: {},

        // Endpoints of the example API.
        endpoints: {
            "begin_registration": "http://localhost:3000/begin_registration/",
            "begin_authentication": "http://localhost:3000/begin_authentication/",
            "begin_deregistration": "http://localhost:3000/begin_deregistration/",
            "finalization": "http://localhost:3000/finalization/"
        },

        // Headers when fetching the example API
        requestHeader: {"Content-Type": "application/json"},

        // Store DOM elements and bind events to the buttons.
        run: () => win.app._onDocumentReady(() => {
            win.app._getElementsById();
            win.app._bindEvents()
        }),

        // Fetch the endpoint which invokes the registration.
        beginRegistrationEvent: () => win.app._beginRequest(win.app.endpoints.begin_registration),

        // Fetch the endpoint which invokes the authentication.
        beginAuthenticationEvent: () => win.app._beginRequest(win.app.endpoints.begin_authentication),

        // Fetch the endpoint which invokes the de-registration.
        beginDeRegistrationEvent: () => win.app._beginRequest(win.app.endpoints.begin_deregistration),

        // Sign registration request and then fetch the endpoint which finalizes the registration.
        finalizeRegistrationEvent: () => {
            win.app._emptyTextElements();
            hankoCredentials.create(win.app.hankoApiResponse.request)
                .then(win.app._finalizeRequest)
                .catch(win.app._showError)
        },

        // Sign authentication request and then fetch the endpoint which finalizes the authentication.
        finalizeAuthenticationEvent: () => {
            win.app._emptyTextElements();
            hankoCredentials.get(win.app.hankoApiResponse.request)
                .then(win.app._finalizeRequest)
                .catch(win.app._showError)
        },

        // Fetch the example API, which itself fetches the Hanko API either for a REG, AUTH or DEREG request. The
        // example API forwards the hankoApiResponse back to us. At least for the finalization of a REG or AUTH request,
        // we need to save the hankoApiResponse.id and hankoApiResponse.request in our front-end.
        _beginRequest: endpoint => {
            win.app._emptyTextElements();
            fetch(endpoint, {method: "GET", headers: win.app.requestHeader})
                .then(response => response.json().then(win.app._setHankoApiResponse).catch(win.app._showError))
                .catch(win.app._showError)
        },

        // Send the signed request to the example API and forward it to the Hanko API.
        _finalizeRequest: credentialRequest => {
            const endpoint = win.app.endpoints.finalization + "?requestId=" + win.app.hankoApiResponse.id,
                body = JSON.stringify(credentialRequest);

            win.app._emptyTextElements();
            fetch(endpoint, {method: "POST", headers: win.app.requestHeader, body: body})
                .then(response => response.json().then(win.app._setHankoApiResponse).catch(win.app._showError))
                .catch(win.app._showError)
        },

        // Get elements by id and store them to the elements property.
        _getElementsById: () => ["request_id-text", "operation-text", "valid_until-text", "status-text", "error-text",
            "begin_registration-button", "finalize_registration-button", "begin_authentication-button",
            "finalize_authentication-button", "begin_deregistration-button"]
            .forEach((elementId) => win.app.elements[elementId] = document.getElementById(elementId)),

        // Bind all the events.
        _bindEvents: () => {
            const elementIdToEvent = {
                "begin_registration-button": win.app.beginRegistrationEvent,
                "finalize_registration-button": win.app.finalizeRegistrationEvent,
                "begin_authentication-button": win.app.beginAuthenticationEvent,
                "finalize_authentication-button": win.app.finalizeAuthenticationEvent,
                "begin_deregistration-button": win.app.beginDeRegistrationEvent
            };

            Object.keys(elementIdToEvent).forEach((elementId) => {
                win.app._bindClickEvent(elementId, elementIdToEvent[elementId])
            })
        },

        // Bind click event to an element if it´s present.
        _bindClickEvent: (elementId, fn) => {
            if (win.app.elements[elementId] !== null) {
                win.app.elements[elementId].addEventListener("click", fn);
            }
        },

        // Sets the hankoApiResponse property and updates the DOM elements
        _setHankoApiResponse: hankoApiResponse => {
            const elementIdToResponseProp = {
                "request_id-text": "id",
                "operation-text": "operation",
                "valid_until-text": "validUntil",
                "status-text": "status"
            };

            win.app.hankoApiResponse = hankoApiResponse;

            if (hankoApiResponse.id === "") {
                win.app._showError("Hanko API response is empty. You may have to register an authenticator " +
                    "device first.");
            }

            Object.keys(elementIdToResponseProp).forEach((elementId) => {
                win.app.elements[elementId].innerText = hankoApiResponse[elementIdToResponseProp[elementId]]
            })
        },

        // Show error to the user.
        _showError: error => win.app.elements["error-text"].innerText = error,

        // Clear out the text elements.
        _emptyTextElements: () => ["request_id-text", "operation-text", "valid_until-text", "status-text", "error-text"]
            .forEach((elementId) => win.app.elements[elementId].innerText = ""),

        // Call fn when document has been loaded
        _onDocumentReady: fn => {
            if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(fn, 1);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }
    }
})(window, hankoCredentials);