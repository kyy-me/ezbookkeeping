package cmd

import (
	"fmt"

	"github.com/urfave/cli/v2"

	"github.com/hocx/ezbookkeeping/pkg/utils"
)

// SecurityUtils represents the security command
var SecurityUtils = &cli.Command{
	Name:  "security",
	Usage: "ezBookkeeping security utilities",
	Subcommands: []*cli.Command{
		{
			Name:   "gen-secret-key",
			Usage:  "Generate a random secret key",
			Action: genSecretKey,
			Flags: []cli.Flag{
				&cli.IntFlag{
					Name:        "length",
					Aliases:     []string{"l"},
					Required:    false,
					DefaultText: "32",
					Usage:       "The length of secret key",
				},
			},
		},
	},
}

func genSecretKey(c *cli.Context) error {
	length := c.Int("length")

	if length <= 0 {
		length = 32
	}

	secretKey, err := utils.GetRandomNumberOrLetter(length)

	if err != nil {
		return err
	}

	fmt.Printf("[Secret Key] %s\n", secretKey)

	return nil
}
