(function (win) {
    win.app = {

        // Store DOM elements.
        elements: {},

        // Store Hanko API response we are getting forwarded from the example API.
        hankoResponse: {id: undefined, request: undefined},

        // Endpoints of the example API.
        endpoints: {
            "begin_registration": "http://localhost:3000/begin_registration/",
            "begin_authentication": "http://localhost:3000/begin_authentication/",
            "begin_deregistration": "http://localhost:3000/begin_deregistration/",
            "finalization": "http://localhost:3000/finalization/"
        },

        // Store DOM elements and bind events to the buttons.
        run: () => win.app._onDocumentReady(() => {
            win.app._getElements();
            win.app._bindEvents()
        }),

        // Fetch the endpoint which invokes the registration.
        beginRegistrationEvent: () => win.app._beginRequest(win.app.endpoints.begin_registration),

        // Fetch the endpoint which invokes the authentication.
        beginAuthenticationEvent: () => win.app._beginRequest(win.app.endpoints.begin_authentication),

        // Fetch the endpoint which invokes the de-registration.
        beginDeRegistrationEvent: () => win.app._beginRequest(win.app.endpoints.begin_deregistration),

        // Sign registration request and then fetch the endpoint which finalizes the registration.
        finalizeRegistrationEvent: () => win.hankoWebAuthn.createCredentials(win.app.hankoResponse.request)
            .then(win.app._finalizeRequest)
            .catch(win.app._showError),

        // Sign authentication request and then fetch the endpoint which finalizes the authentication.
        finalizeAuthenticationEvent: () => win.hankoWebAuthn.getCredentials(win.app.hankoResponse.request)
            .then(win.app._finalizeRequest)
            .catch(win.app._showError),

        // Fetch the example API, which itself fetches the Hanko API either for a REG, AUTH or DEREG request. The
        // example API forwards the Hanko API Response to the user.
        _beginRequest: url => {
            win.app._clearTextElements();
            fetch(url, {method: "GET", headers: {"Content-Type": "application/json"}})
                .then(response => response.json()
                    .then(json => {
                        // Store id and request for signing.
                        win.app.hankoResponse.id = json["id"];
                        win.app.hankoResponse.request = json["request"];
                        win.app._showHankoResponse(json)
                    })
                    .catch(win.app._showError))
                .catch(win.app._showError)
        },

        // Send the signed WebAuthn request to the example API and forwarded it to the Hanko API.
        _finalizeRequest: request => {
            const url = win.app.endpoints.finalization + "?requestId=" + win.app.hankoResponse.id,
                body = JSON.stringify(request);
            win.app._clearTextElements();
            fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: body})
                .then(response => response.json().then(win.app._showHankoResponse).catch(win.app._showError))
                .catch(win.app._showError)
        },

        // Get elements by id and store them to the elements property.
        _getElements: () => ["request_id-text", "operation-text", "valid_until-text", "status-text", "error-text",
            "begin_registration-button", "finalize_registration-button", "begin_authentication-button",
            "finalize_authentication-button", "begin_deregistration-button"]
            .forEach((id) => win.app.elements[id] = document.getElementById(id)),

        // Bind all the events.
        _bindEvents: () => {
            const map = {
                "begin_registration-button": win.app.beginRegistrationEvent,
                "finalize_registration-button": win.app.finalizeRegistrationEvent,
                "begin_authentication-button": win.app.beginAuthenticationEvent,
                "finalize_authentication-button": win.app.finalizeAuthenticationEvent,
                "begin_deregistration-button": win.app.beginDeRegistrationEvent
            };
            Object.keys(map).forEach((key) => win.app._bindClickEvent(key, map[key]))
        },

        // Bind click event to an element if it´s present.
        _bindClickEvent: (elementId, fn) => {
            if (win.app.elements[elementId] !== null)
                win.app.elements[elementId].addEventListener("click", fn)
        },

        // Show error to the user.
        _showError: error => win.app.elements["error-text"].innerText = error,

        // Give a hankoResponse and fill the status table with content.
        _showHankoResponse: hankoResponse => {
            const map = {
                "request_id-text": "id",
                "operation-text": "operation",
                "valid_until-text": "validUntil",
                "status-text": "status"
            };
            Object.keys(map).forEach((key) => win.app.elements[key].innerText = hankoResponse[map[key]])
        },

        // Clear out the text elements.
        _clearTextElements: () => ["request_id-text", "operation-text", "valid_until-text", "status-text", "error-text"]
            .forEach((id) => win.app.elements[id].innerText = ""),

        // Call fn when document has been loaded
        _onDocumentReady: fn => {
            if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(fn, 1);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }
    }
})(window);