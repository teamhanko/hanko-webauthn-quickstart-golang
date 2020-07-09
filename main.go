package main

import (
	"encoding/json"
	"fmt"
	"github.com/pkg/errors"
	"github.com/teamhanko/hanko-sdk-golang"
	"html/template"
	"log"
	"net/http"
	"path"
)

var apiClient *hankoApiClient.HankoApiClient
var userId string
var userName string

type TemplateData struct {
	UserId string
}

func init() {
	cfg := RequireKeys([]string{"apiUrl", "apiKey", "userId", "userName"})

	apiClient = hankoApiClient.NewHankoApiClient(cfg.GetString("apiUrl"), cfg.GetString("apiKey"))
	userId = cfg.GetString("userId")
	userName = cfg.GetString("userName")
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
	apiResp, err := apiClient.InitWebauthnRegistration(userId, userName)
	handleResponse(w, apiResp, err)
}

func beginAuthentication(w http.ResponseWriter, r *http.Request) {
	apiResp, err := apiClient.InitWebAuthnAuthentication(userId, userName)
	handleResponse(w, apiResp, err)
}

func beginDeRegistration(w http.ResponseWriter, r *http.Request) {
	apiResp, err := apiClient.InitWebAuthnDeRegistration(userId, userName)
	handleResponse(w, apiResp, err)
}

func handleResponse(w http.ResponseWriter, apiResp *hankoApiClient.Response, err error) {
	if err != nil {
		err = errors.Wrapf(err, "api call failed - user: %s (%s)", userId, userName)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	renderJson(w, apiResp)
}

func finalize(w http.ResponseWriter, r *http.Request) {
	requestId := r.URL.Query().Get("requestId")
	pubKey := hankoApiClient.PublicKeyCredential{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&pubKey)
	if err != nil {
		err := errors.Wrap(err, "failed to decode the webAuthnResp")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	credReq := hankoApiClient.HankoCredentialRequest{
		WebAuthnResponse: pubKey,
	}

	apiResp, err := apiClient.FinalizeWebAuthnOperation(requestId,&credReq)
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
		UserId: userId,
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
