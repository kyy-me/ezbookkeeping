package cmd

import (
	"github.com/urfave/cli/v2"

	"github.com/hocx/ezbookkeeping/pkg/datastore"
	"github.com/hocx/ezbookkeeping/pkg/log"
	"github.com/hocx/ezbookkeeping/pkg/models"
)

// Database represents the database command
var Database = &cli.Command{
	Name:  "database",
	Usage: "ezBookkeeping database maintenance",
	Subcommands: []*cli.Command{
		{
			Name:   "update",
			Usage:  "Update database structure",
			Action: updateDatabaseStructure,
		},
	},
}

func updateDatabaseStructure(c *cli.Context) error {
	_, err := initializeSystem(c)

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateDatabaseStructure] starting maintaining")

	err = updateAllDatabaseTablesStructure()

	if err != nil {
		log.BootErrorf("[database.updateDatabaseStructure] update database table structure failed, because %s", err.Error())
		return err
	}

	log.BootInfof("[database.updateDatabaseStructure] all tables maintained successfully")
	return nil
}

func updateAllDatabaseTablesStructure() error {
	var err error

	err = datastore.Container.UserStore.SyncStructs(new(models.User))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] user table maintained successfully")

	err = datastore.Container.UserStore.SyncStructs(new(models.TwoFactor))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] two-factor table maintained successfully")

	err = datastore.Container.UserStore.SyncStructs(new(models.TwoFactorRecoveryCode))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] two-factor recovery code table maintained successfully")

	err = datastore.Container.TokenStore.SyncStructs(new(models.TokenRecord))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] token record table maintained successfully")

	err = datastore.Container.UserDataStore.SyncStructs(new(models.Account))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] account table maintained successfully")

	err = datastore.Container.UserDataStore.SyncStructs(new(models.Transaction))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] transaction table maintained successfully")

	err = datastore.Container.UserDataStore.SyncStructs(new(models.TransactionCategory))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] transaction category table maintained successfully")

	err = datastore.Container.UserDataStore.SyncStructs(new(models.TransactionTag))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] transaction tag table maintained successfully")

	err = datastore.Container.UserDataStore.SyncStructs(new(models.TransactionTagIndex))

	if err != nil {
		return err
	}

	log.BootInfof("[database.updateAllDatabaseTablesStructure] transaction tag index table maintained successfully")

	return nil
}
