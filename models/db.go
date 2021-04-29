package models

import (
	"fmt"
	"github.com/boltdb/bolt"
)

func getDb() (db *bolt.DB, err error) {
	db, err = bolt.Open("user.db", 0600, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create db: %s", err)
	}
	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte("Users"))
		if err != nil {
			panic(fmt.Errorf("create bucket: %s", err))
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create bucket: %s", err)
	}
	return db, nil
}
