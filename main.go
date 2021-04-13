package main

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"github.com/teamhanko/hanko-sdk-golang/client"
	"github.com/teamhanko/hanko-sdk-golang/webauthn"
	"gitlab.com/hanko/hanko-test-app/config"
	"net/http"
	"strconv"
)

var apiClient *webauthn.Client
var userId string
var userName string

func init() {
	apiClient = webauthn.NewClient(config.C.ApiUrl, config.C.ApiSecret, client.WithHmac(config.C.ApiKeyId),
		client.WithLogLevel(log.DebugLevel))
	userId = config.C.UserName
	userName = config.C.UserName
}

func main() {
	r := gin.Default()
	r.Static("/assets", "./assets")
	r.StaticFile("/favicon.ico", "./assets/favicon.ico")
	r.StaticFile("/", "./index.html")

	r.POST("/registration_initialize", func(c *gin.Context) {
		authenticatorAttachment := c.Query("authenticator_attachment")
		userVerification := c.Query("user_verification")
		conveyancePreference := c.Query("conveyance_preference")
		requireResidentKeyStr := c.Query("require_resident_key")
		requireResidentKeyBool, _ := strconv.ParseBool(requireResidentKeyStr)

		user := client.User{
			ID:          userId,
			Name:        userName,
			DisplayName: userName,
		}

		authenticatorSelection := webauthn.AuthenticatorSelection{
			AuthenticatorAttachment: webauthn.AuthenticatorAttachment(authenticatorAttachment),
			UserVerification:        webauthn.UserVerificationRequirement(userVerification),
			RequireResidentKey:      &requireResidentKeyBool,
		}

		options := webauthn.RegistrationInitializationRequestOptions{
			AuthenticatorSelection: authenticatorSelection,
			ConveyancePreference:   webauthn.ConveyancePreference(conveyancePreference),
		}

		request := webauthn.RegistrationInitializationRequest{User: user, Options: options}

		response, apiErr := apiClient.InitializeRegistration(&request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.POST("/registration_finalize", func(c *gin.Context) {
		request := &webauthn.RegistrationFinalizationRequest{}
		dec := json.NewDecoder(c.Request.Body)
		err := dec.Decode(request)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		response, apiErr := apiClient.FinalizeRegistration(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.POST("/authentication_initialize", func(c *gin.Context) {
		authenticatorAttachment := c.Query("authenticator_attachment")
		userVerification := c.Query("user_verification")

		user := client.User{
			ID:          userId,
			Name:        userName,
			DisplayName: userName,
		}

		options := webauthn.AuthenticationInitializationRequestOptions{
			UserVerification:        webauthn.UserVerificationRequirement(userVerification),
			AuthenticatorAttachment: webauthn.AuthenticatorAttachment(authenticatorAttachment),
		}

		request := &webauthn.AuthenticationInitializationRequest{User: user, Options: options}

		response, apiErr := apiClient.InitializeAuthentication(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.POST("/authentication_finalize", func(c *gin.Context) {
		request := &webauthn.AuthenticationFinalizationRequest{}

		dec := json.NewDecoder(c.Request.Body)
		err := dec.Decode(request)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		response, apiErr := apiClient.FinalizeAuthentication(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.GET("/credentials/:credential_id", func(c *gin.Context) {
		credentialId := c.Param("credential_id")

		response, apiErr := apiClient.GetCredential(credentialId)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.GET("/credentials", func(c *gin.Context) {
		request := &webauthn.CredentialQuery{UserId: userId}

		response, apiErr := apiClient.ListCredentials(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.DELETE("/credentials/:credential_id", func(c *gin.Context) {
		credentialId := c.Param("credential_id")

		apiErr := apiClient.DeleteCredential(credentialId)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{})
	})

	log.Println("Starting Server on localhost:3000")
	log.Fatal(r.Run(":3000"))
}
