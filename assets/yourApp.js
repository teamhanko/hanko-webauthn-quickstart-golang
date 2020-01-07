(function (win) {
    win.yourApp = {
        hankoResponse: {id: undefined, request: undefined},
        run: site => win.yourApp._onDocumentReady(() => win.yourApp._bindEvents(site)),
        beginRegistration: () => win.yourApp._beginRequest("http://localhost:3000/begin_registration/"),
        beginAuthentication: () => win.yourApp._beginRequest("http://localhost:3000/begin_authentication/"),
        beginDeRegistration: () => win.yourApp._beginRequest("http://localhost:3000/begin_deregistration/"),
        finalizeRegistration: () => win.hankoWebAuthn.createCredentials(win.yourApp.hankoResponse.request)
            .then(win.yourApp._finalizeRequest)
            .catch(win.yourApp._showError),
        finalizeAuthentication: () => win.hankoWebAuthn.getCredentials(win.yourApp.hankoResponse.request)
            .then(win.yourApp._finalizeRequest)
            .catch(win.yourApp._showError),
        _bindEvents: site => {
            if (site === "registration") {
                win.yourApp._bindEvent("beginRegistration-button", win.yourApp.beginRegistration);
                win.yourApp._bindEvent("finalizeRegistration-button", win.yourApp.finalizeRegistration);
            } else if (site === "authentication") {
                win.yourApp._bindEvent("beginAuthentication-button", win.yourApp.beginAuthentication);
                win.yourApp._bindEvent("finalizeAuthentication-button", win.yourApp.finalizeAuthentication);
            } else if (site === "deregistration") {
                win.yourApp._bindEvent("beginDeRegistration-button", win.yourApp.beginDeRegistration);
            }
        },
        _bindEvent: (elementId, fn) => document.getElementById(elementId).addEventListener("click", fn),
        _showError: error => document.getElementById("error_message").innerText = error,
        _showApiResponse: data => {
            document.getElementById("request_id").innerText = data["Id"];
            document.getElementById("operation").innerText = data["Operation"];
            document.getElementById("valid_until").innerText = data["ValidUntil"];
            document.getElementById("status").innerText = data["Status"];
        },
        _reset: () => {
            document.getElementById("request_id").innerText = "";
            document.getElementById("operation").innerText = "";
            document.getElementById("valid_until").innerText = "";
            document.getElementById("status").innerText = "";
            document.getElementById("error_message").innerText = "";
        },
        _beginRequest: url => {
            win.yourApp._reset();
            fetch(url, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(json => {
                        win.yourApp.hankoResponse.id = json["Id"];
                        win.yourApp.hankoResponse.request = json["Request"];
                        win.yourApp._showApiResponse(json)
                    }).catch(win.yourApp._showError)
                } else {
                    win.yourApp._showError(response.status + " - " + response.statusText)
                }
            }).catch(win.yourApp._showError)
        },
        _finalizeRequest: request => {
            win.yourApp._reset();
            fetch("http://localhost:3000/finalize/?requestId=" + win.yourApp.hankoResponse.id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(request)
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(win.yourApp._showApiResponse).catch(win.yourApp._showError)
                } else {
                    win.yourApp._showError(response.status + " - " + response.statusText)
                }
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