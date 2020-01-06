package hankoApiClient

import (
	"bytes"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"net/http"
)

type Operation string

const (
	AUTH  Operation = "AUTH"
	REG   Operation = "REG"
	DEREG Operation = "DEREG"
)

type ClientData struct {
	RemoteAddress string `json:"remoteAddress"`
	UserAgent     string `json:"userAgent"`
}

type AuthenticatorSelectionCriteria struct {
	UserVerification        string `json:"userVerification"`
	AuthenticatorAttachment string `json:"authenticatorAttachment"`
}

type Request struct {
	Operation                      Operation                       `json:"operation"`
	Username                       string                          `json:"username"`
	UserId                         uuid.UUID                       `json:"userId"`
	ClientData                     *ClientData                     `json:"clientData"`
	DeviceIds                      *[]string                       `json:"deviceIds"`
	AuthenticatorSelectionCriteria *AuthenticatorSelectionCriteria `json:"authenticatorSelectionCriteria"`
}

type RelyingParty struct {
	AppId                       string `json:"appId"`
	AuthenticationTimeoutSecond int    `json:"authenticationTimeoutSeconds"`
	BasicIntegrity              bool   `json:"basicIntegrity"`
	CtsProfileMatch             bool   `json:"ctsProfileMatch"`
	Icon                        string `json:"icon"`
	Id                          string `json:"id"`
	Jailbreak                   bool   `json:"jailbreak"`
	Name                        string `json:"name"`
	RegistrationTimeoutSeconds  int    `json:"registrationTimeoutSeconds"`
	ShowLocation                bool   `json:"showLocation"`
}

type Link struct {
	Href   string `json:"href"`
	Method string `json:"method"`
	Rel    string `json:"rel"`
}

type Response struct {
	Id           string       `json:"id"`
	Operation    Operation    `json:"operation"`
	Username     string       `json:"username"`
	UserId       string       `json:"userId"`
	Status       string       `json:"status"`
	CreatedAt    string       `json:"createdAt"`
	ValidUntil   string       `json:"validUntil"`
	RelyingParty RelyingParty `json:"relyingParty"`
	Request      string       `json:"request"`
	DeviceId     string       `json:"deviceId"`
	Links        []Link       `json:"links"`
}

type AuthenticatorResponse struct {
	AttestationObject string `json:"attestationObject,omitempty"`
	ClientDataJson    string `json:"clientDataJSON"`
	AuthenticatorData string `json:"authenticatorData,omitempty"`
	Signature         string `json:"signature,omitempty"`
	UserHandle        string `json:"userHandle,omitempty"`
}

type PublicKeyCredential struct {
	Id       string                `json:"id"`
	RawId    string                `json:"rawId"`
	Type     string                `json:"type"`
	Response AuthenticatorResponse `json:"response"`
}

type DeviceKeyInfo struct {
	KeyName string `json:"keyName"`
}

type HankoApiRequest struct {
	WebAuthnResponse PublicKeyCredential `json:"webAuthnResponse"`
	DeviceKeyInfo    DeviceKeyInfo       `json:"deviceKeyInfo"`
}

type HankoApiClient struct {
	baseUrl    string
	secret     string
	httpClient http.Client
}

func NewHankoApiClient(baseUrl string, secret string) *HankoApiClient {
	return &HankoApiClient{
		baseUrl: baseUrl,
		secret:  secret,
	}
}

func (client *HankoApiClient) Request(method string, path string, request interface{}) (*Response, error) {
	buf := new(bytes.Buffer)
	if request != nil {
		err := json.NewEncoder(buf).Encode(request)
		if err != nil {
			return nil, errors.Wrap(err, "failed to encode the request")
		}
	}

	req, err := http.NewRequest(method, client.baseUrl+path, buf)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to create request %s %s", method, client.baseUrl+path)
	}

	req.Header.Add("Authorization", "secret "+client.secret)
	req.Header.Add("Content-Type", "application/json")
	resp, err := client.httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "could not do request")
	}

	apiResp := &Response{}
	dec := json.NewDecoder(resp.Body)
	err = dec.Decode(apiResp)
	if err != nil {
		return nil, errors.Wrap(err, "failed to decode the response")
	}

	return apiResp, nil
}
