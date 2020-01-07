(function (win) {
    win.yourApp = {
        hankoResponse: {id: undefined, request: undefined},
        elements: {},
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
                win.yourApp._bindEvent("begin_registration-button", win.yourApp.beginRegistration);
                win.yourApp._bindEvent("finalize_registration-button", win.yourApp.finalizeRegistration);
            } else if (site === "authentication") {
                win.yourApp._bindEvent("begin_authentication-button", win.yourApp.beginAuthentication);
                win.yourApp._bindEvent("finalize_authentication-button", win.yourApp.finalizeAuthentication);
            } else if (site === "deregistration") {
                win.yourApp._bindEvent("begin_de_registration-button", win.yourApp.beginDeRegistration);
            }
        },
        _bindEvent: (elementId, fn) => document.getElementById(elementId).addEventListener("click", fn),
        _showError: error => document.getElementById("error-text").innerText = error,
        _showApiResponse: data => {
            document.getElementById("request_id-text").innerText = data["Id"];
            document.getElementById("operation-text").innerText = data["Operation"];
            document.getElementById("valid_until-text").innerText = data["ValidUntil"];
            document.getElementById("status-text").innerText = data["Status"];
        },
        _reset: () => {
            document.getElementById("request_id-text").innerText = "";
            document.getElementById("operation-text").innerText = "";
            document.getElementById("valid_until-text").innerText = "";
            document.getElementById("status-text").innerText = "";
            document.getElementById("error-text").innerText = "";
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