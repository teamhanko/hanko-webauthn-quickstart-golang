package config

import (
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	"path/filepath"
	"runtime"
	"strings"
)

type config struct {
	ApiUrl    string
	ApiSecret string
	ApiKeyId  string
}

var C *config

func init() {
	C = getConfig()
}

func getConfig() *config {
	_, b, _, _ := runtime.Caller(0)
	basePath := filepath.Dir(b)

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.SetConfigType("yaml")
	viper.AddConfigPath(basePath)
	viper.SetConfigName("config")

	if err := viper.ReadInConfig(); err != nil {
		panic(errors.Wrap(err, "error on parsing standard configuration file"))
	}

	c := &config{}
	if err := viper.Unmarshal(c); err != nil {
		panic(errors.Wrap(err, "unable to decode into struct"))
	}

	return c
}
