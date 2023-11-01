package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("ezef6sf4s3vzpvt")
		if err != nil {
			return err
		}

		// add
		new_cover := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "dtpqcimw",
			"name": "cover",
			"type": "file",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"maxSize": 5242880,
				"mimeTypes": [],
				"thumbs": [],
				"protected": false
			}
		}`), new_cover)
		collection.Schema.AddField(new_cover)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("ezef6sf4s3vzpvt")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("dtpqcimw")

		return dao.SaveCollection(collection)
	})
}
