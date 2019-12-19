package main

import (
	"encoding/json"
	"fmt"
	"github.com/pkg/errors"
	"gitlab.com/hanko/hanko-test-app/hankoApiClient"
	"html/template"
	"log"
	"net/http"
	"path"
)

var apiHost = "https://api.dev.hanko.io/v1"
var apiSecret = "17a1b9585cc92782d6017324c77887b283427e8076a2e775dbd7570"
var apiClient = hankoApiClient.NewHankoApiClient(apiHost, apiSecret)
var userId = "114bb280-ab1a-485d-a922-33f777b25177"
var userName = "testapp@hanko.io"

type TemplateData struct {
	Id         string
	Request    string
	Status     string
	Operation  string
	ValidUntil string
}

func main() {
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/register/", initRegistrationHandler)
	http.HandleFunc("/authenticate/", initAuthenticationHandler)
	http.HandleFunc("/finalize/", finalizeHandler)
	http.HandleFunc("/assets/", assetHandler)
	log.Fatal(http.ListenAndServe(":3000", nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/register", http.StatusMovedPermanently)
}

func initRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	initHandler(w, r, hankoApiClient.REG, "register")
}

func initAuthenticationHandler(w http.ResponseWriter, r *http.Request) {
	initHandler(w, r, hankoApiClient.AUTH, "authenticate")
}

func initHandler(w http.ResponseWriter, r *http.Request, operation hankoApiClient.Operation, template string) {
	apiResp, err := apiClient.Request(http.MethodPost, "/webauthn/requests", &hankoApiClient.Request{
		Operation: operation,
		Username:  userName,
		UserId:    userId,
	})
	if err != nil {
		err = errors.Wrapf(err, "failed to %s: %s (%s)", operation, userId, userName)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	renderTemplate(w, template, &TemplateData{
		Id:         apiResp.Id,
		Request:    apiResp.Request,
		Status:     apiResp.Status,
		Operation:  string(apiResp.Operation),
		ValidUntil: apiResp.ValidUntil,
	})
}

func finalizeHandler(w http.ResponseWriter, r *http.Request) {
	requestId := r.URL.Query().Get("requestId")
	apiReq := hankoApiClient.HankoApiRequest{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&apiReq)
	if err != nil {
		err := errors.Wrap(err, "failed to decode the webAuthnResp")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	apiResp, err := apiClient.Request(http.MethodPut, "/webauthn/requests/"+requestId, apiReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	respondJson(w, apiResp)
}

func assetHandler(w http.ResponseWriter, r *http.Request) {
	_, file := path.Split(r.URL.Path)
	http.ServeFile(w, r, path.Join("assets", file))
}

func renderTemplate(w http.ResponseWriter, name string, templateData *TemplateData) {
	file := fmt.Sprintf("templates/%s.html", name)
	tmpl, _ := template.ParseFiles(file, "templates/base.html")
	err := tmpl.ExecuteTemplate(w, "base", templateData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func respondJson(w http.ResponseWriter, response interface{}) {
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
