package main

import (
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	"log"
	"strings"
	"sync"
)

var onceCfg sync.Once
var cfg *viper.Viper

func GetConfig() *viper.Viper {
	onceCfg.Do(ReadInConfig)
	return cfg
}

func ReadInConfig() {
	var err error

	cfg = viper.New()

	replacer := strings.NewReplacer(".", "_")

	cfg.AutomaticEnv()
	cfg.SetEnvKeyReplacer(replacer)
	cfg.SetConfigType("yaml")
	cfg.AddConfigPath("./config")
	cfg.SetConfigName("config")

	cfg.SetDefault("userId", uuid.New().String())

	err = cfg.ReadInConfig()
	if err != nil {
		log.Println(errors.Wrap(err, "error on parsing configuration file"))
	}
}

func RequireKeys(keys []string) *viper.Viper {
	GetConfig()
	for _, key := range keys {
		if !cfg.IsSet(key) {
			log.Panicf("config key '%s' not set", key)
		}
	}
	return cfg
}
