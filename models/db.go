package models

import (
	"fmt"
	"github.com/boltdb/bolt"
)

var DB *bolt.DB

func init() {
	var err error
	DB, err = connect()
	if err != nil {
		panic(err)
	}
}

func connect() (db *bolt.DB, err error) {
	db, err = bolt.Open("user.db", 0600, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create db: %s", err)
	}
	err = db.Update(func(tx *bolt.Tx) error {
		_, e := tx.CreateBucketIfNotExists([]byte("Users"))
		return e
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create bucket: %s", err)
	}
	return db, nil
}
