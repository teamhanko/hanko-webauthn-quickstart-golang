package models

import (
	"github.com/boltdb/bolt"
)

type User struct {
	ID   string
	Name string
}

func NewUser(id string, name string) *User {
	return &User{ID: id, Name: name}
}

func FindUserByName(name string) (user *User, err error) {
	db, err := getDb()
	if err != nil {
		return nil, err
	}
	defer db.Close()
	err = db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("Users"))
		v := b.Get([]byte(name))
		if len(v) != 0 {
			user = &User{ID: string(v), Name: name}
		}
		return nil
	})
	return user, err
}

func (u *User) Save() (err error) {
	db, err := getDb()
	if err != nil {
		return err
	}
	defer db.Close()
	err = db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("Users"))
		err := b.Put([]byte(u.Name), []byte(u.ID))
		return err
	})
	return err
}
