package main

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	// include migrations in build
	_ "github.com/tmshv/opla/migrations"
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
		e.Router.GET("/*", apis.StaticDirectoryHandler(frontend, true))
		return nil
	})

	// setup migrations
	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
