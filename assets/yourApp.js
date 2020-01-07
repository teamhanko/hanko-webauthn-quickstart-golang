(function (win) {
    win.yourApp = {
        hankoResponse: {id: undefined, request: undefined},
        elements: {},
        run: () => win.yourApp._onDocumentReady(() => {
            win.yourApp._getElements();
            win.yourApp._bindEvents()
        }),
        beginRegistration: () => win.yourApp._beginRequest("http://localhost:3000/begin_registration/"),
        beginAuthentication: () => win.yourApp._beginRequest("http://localhost:3000/begin_authentication/"),
        beginDeRegistration: () => win.yourApp._beginRequest("http://localhost:3000/begin_deregistration/"),
        finalizeRegistration: () => win.hankoWebAuthn.createCredentials(win.yourApp.hankoResponse.request)
            .then(win.yourApp._finalizeRequest)
            .catch(win.yourApp._showError),
        finalizeAuthentication: () => win.hankoWebAuthn.getCredentials(win.yourApp.hankoResponse.request)
            .then(win.yourApp._finalizeRequest)
            .catch(win.yourApp._showError),
        _getElements: () => {
            ["request_id-text", "operation-text", "valid_until-text", "status-text", "error-text",
                "begin_registration-button", "finalize_registration-button", "begin_authentication-button",
                "finalize_authentication-button", "begin_de_registration-button"
            ].forEach((id) => win.yourApp.elements[id] = document.getElementById(id))
        },
        _bindEvents: () => {
            win.yourApp._bindClickEvent("begin_registration-button", win.yourApp.beginRegistration);
            win.yourApp._bindClickEvent("finalize_registration-button", win.yourApp.finalizeRegistration);
            win.yourApp._bindClickEvent("begin_authentication-button", win.yourApp.beginAuthentication);
            win.yourApp._bindClickEvent("finalize_authentication-button", win.yourApp.finalizeAuthentication);
            win.yourApp._bindClickEvent("begin_de_registration-button", win.yourApp.beginDeRegistration);
        },
        _bindClickEvent: (elementId, fn) => {
            if (win.yourApp.elements[elementId] !== null)
                win.yourApp.elements[elementId].addEventListener("click", fn)
        },
        _showError: error => win.yourApp.elements["error-text"].innerText = error,
        _showApiResponse: data => {
            win.yourApp.elements["request_id-text"].innerText = data["Id"];
            win.yourApp.elements["operation-text"].innerText = data["Operation"];
            win.yourApp.elements["valid_until-text"].innerText = data["ValidUntil"];
            win.yourApp.elements["status-text"].innerText = data["Status"];
        },
        _clearTextElements: () => {
            win.yourApp.elements["request_id-text"].innerText = "";
            win.yourApp.elements["operation-text"].innerText = "";
            win.yourApp.elements["valid_until-text"].innerText = "";
            win.yourApp.elements["status-text"].innerText = "";
            win.yourApp.elements["error-text"].innerText = "";
        },
        _beginRequest: url => {
            win.yourApp._clearTextElements();
            fetch(url, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }).then(response => {
                response.json().then(json => {
                    win.yourApp.hankoResponse.id = json["Id"];
                    win.yourApp.hankoResponse.request = json["Request"];
                    win.yourApp._showApiResponse(json)
                }).catch(win.yourApp._showError)
            }).catch(win.yourApp._showError)
        },
        _finalizeRequest: request => {
            win.yourApp._clearTextElements();
            fetch("http://localhost:3000/finalize/?requestId=" + win.yourApp.hankoResponse.id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(request)
            }).then(response => {
                response.json().then(win.yourApp._showApiResponse).catch(win.yourApp._showError)
            }).catch(win.yourApp._showError)
        },
        _onDocumentReady: fn => {
            if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(fn, 1);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }
    }
})(window);