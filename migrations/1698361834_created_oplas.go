package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "ezef6sf4s3vzpvt",
			"created": "2023-10-26 23:10:34.857Z",
			"updated": "2023-10-26 23:10:34.857Z",
			"name": "oplas",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "im0ks982",
					"name": "name",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": 256,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "gdq0s1l2",
					"name": "definition",
					"type": "json",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "h74ecnvr",
					"name": "owner",
					"type": "relation",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				}
			],
			"indexes": [],
			"listRule": null,
			"viewRule": null,
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("ezef6sf4s3vzpvt")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
