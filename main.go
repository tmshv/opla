package main

import (
	"embed"
	"io/fs"
	"log"
	"os"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

//go:embed all:dist
var dist embed.FS

func getDistFS(dev bool) fs.FS {
	if dev {
		return os.DirFS("./dist")
	}

	return echo.MustSubFS(dist, "dist")
}

func main() {
	app := pocketbase.New()

	// serves frontend files from the dist dir
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		frontend := getDistFS(false)
		e.Router.GET("/*", apis.StaticDirectoryHandler(frontend, false))
		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
