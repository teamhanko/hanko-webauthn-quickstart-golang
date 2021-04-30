package main

import (
	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
	"github.com/teamhanko/hanko-sdk-golang/webauthn"
	"gitlab.com/hanko/hanko-test-app/config"
	"gitlab.com/hanko/hanko-test-app/models"
	"net/http"
	"strconv"
	"strings"
)

var apiClient *webauthn.Client

func init() {
	apiClient = webauthn.NewClient(config.C.ApiUrl, config.C.ApiSecret).WithHmac(config.C.ApiKeyId).
		WithLogLevel(log.DebugLevel)
}

func main() {
	r := gin.Default()
	r.Static("/assets", "./assets")
	r.StaticFile("/favicon.ico", "./assets/favicon.ico")
	r.StaticFile("/", "./index.html")

	r.POST("/registration_initialize", func(c *gin.Context) {
		userName := strings.TrimSpace(c.Query("user_name"))
		authenticatorAttachment := c.Query("authenticator_attachment")
		userVerification := c.Query("user_verification")
		conveyancePreference := c.Query("conveyance_preference")
		requireResidentKeyStr := c.Query("require_resident_key")
		requireResidentKeyBool, _ := strconv.ParseBool(requireResidentKeyStr)

		if userName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user name not provided"})
			return
		}

		userModel, err := models.FindUserByName(userName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if userModel == nil {
			userModel = models.NewUser(uuid.NewV4().String(), userName)
			err = userModel.Save()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		user := webauthn.NewRegistrationInitializationUser(userModel.ID, userModel.Name)

		authenticatorSelection := webauthn.NewAuthenticatorSelection().
			WithUserVerification(webauthn.UserVerificationRequirement(userVerification)).
			WithAuthenticatorAttachment(webauthn.AuthenticatorAttachment(authenticatorAttachment)).
			WithRequireResidentKey(requireResidentKeyBool)

		request := webauthn.NewRegistrationInitializationRequest(user).
			WithAuthenticatorSelection(authenticatorSelection).
			WithConveyancePreference(webauthn.ConveyancePreference(conveyancePreference))

		response, apiErr := apiClient.InitializeRegistration(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.POST("/registration_finalize", func(c *gin.Context) {
		request, err := webauthn.ParseRegistrationFinalizationRequest(c.Request.Body)
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
		userName := strings.TrimSpace(c.Query("user_name"))
		authenticatorAttachment := c.Query("authenticator_attachment")
		userVerification := c.Query("user_verification")

		request := webauthn.NewAuthenticationInitializationRequest().
			WithUserVerification(webauthn.UserVerificationRequirement(userVerification)).
			WithAuthenticatorAttachment(webauthn.AuthenticatorAttachment(authenticatorAttachment))

		if userName != "" {
			userModel, err := models.FindUserByName(userName)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if userModel != nil {
				request.WithUser(webauthn.NewAuthenticationInitializationUser(userModel.ID).WithName(userModel.Name))
			}
		}

		response, apiErr := apiClient.InitializeAuthentication(request)
		if apiErr != nil {
			c.JSON(apiErr.StatusCode, gin.H{"error": apiErr.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	})

	r.POST("/authentication_finalize", func(c *gin.Context) {
		request, err := webauthn.ParseAuthenticationFinalizationRequest(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		response, apiErr := apiClient.ListCredentials(nil)
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
