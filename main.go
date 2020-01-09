package main

import (
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/teamhanko/hankoapiclientgo"
	"html/template"
	"log"
	"net/http"
	"path"
)

var apiHost = "https://api.dev.hanko.io/v1"
var apiSecret = "17a1b9585cc92782d6017324c77887b283427e8076a2e775dbd7570"
var apiClient = hankoApiClient.NewHankoApiClient(apiHost, apiSecret)
var userId = uuid.New()
var userName = "testapp@hanko.io"

type TemplateData struct {
	UserId string
}

func main() {
	// serve static content
	http.HandleFunc("/assets/", assetHandler)
	http.HandleFunc("/favicon.ico", assetHandler)

	// serve templates
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/show_authentication/", showAuthenticationPage)
	http.HandleFunc("/show_registration/", showRegistrationPage)
	http.HandleFunc("/show_deregistration/", showDeRegistrationPage)

	// json endpoints
	http.HandleFunc("/begin_authentication/", beginAuthentication)
	http.HandleFunc("/begin_registration/", beginRegistration)
	http.HandleFunc("/begin_deregistration/", beginDeRegistration)
	http.HandleFunc("/finalization/", finalize)

	// server start
	log.Println("Starting Server on localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/show_registration", http.StatusFound)
}

func showAuthenticationPage(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "authentication")
}

func showRegistrationPage(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "registration")
}

func showDeRegistrationPage(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "deregistration")
}

func beginRegistration(w http.ResponseWriter, r *http.Request) {
	apiResp, err := apiClient.InitWebauthnRegistration(userId.String(), userName)
	handleResponse(w, r, apiResp, err)
}

func beginAuthentication(w http.ResponseWriter, r *http.Request) {
	apiResp, err := apiClient.InitWebAuthnAuthentication(userId.String(), userName)
	handleResponse(w, r, apiResp, err)
}

func beginDeRegistration(w http.ResponseWriter, r *http.Request) {
	apiResp, err := apiClient.InitWebAuthnDeRegistration(userId.String(), userName)
	handleResponse(w, r, apiResp, err)
}

func handleResponse(w http.ResponseWriter, r *http.Request, apiResp *hankoApiClient.Response, err error) {
	if err != nil {
		err = errors.Wrapf(err, "failed to %s: %s (%s)", apiResp.Operation, userId, userName)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	renderJson(w, apiResp)
}

func finalize(w http.ResponseWriter, r *http.Request) {
	requestId := r.URL.Query().Get("requestId")
	apiReq := hankoApiClient.HankoCredentialRequest{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&apiReq)
	if err != nil {
		err := errors.Wrap(err, "failed to decode the webAuthnResp")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	apiResp, err := apiClient.FinalizeWebAuthnOperation(requestId,&apiReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	renderJson(w, apiResp)
}

func assetHandler(w http.ResponseWriter, r *http.Request) {
	_, file := path.Split(r.URL.Path)
	http.ServeFile(w, r, path.Join("assets", file))
}

func renderTemplate(w http.ResponseWriter, site string) {
	file := fmt.Sprintf("templates/%s.html", site)
	tmpl, _ := template.ParseFiles(file, "templates/main.html")
	err := tmpl.ExecuteTemplate(w, "main", &TemplateData{
		UserId: userId.String(),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func renderJson(w http.ResponseWriter, response interface{}) {
	js, err := json.Marshal(response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(js)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
