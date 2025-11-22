package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/tnfssc/skillz/cli/internal/auth"
	"github.com/tnfssc/skillz/cli/internal/ui"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Log in to the Skillz registry",
	Long: `Log in to the Skillz registry using an API token.

You can generate an API token from the Skillz web interface.
Once you have a token, run:
  skillz login --token <your-token>

Or simply run 'skillz login' and paste the token when prompted.`,
	RunE: runLogin,
}

var (
	loginToken string
)

func init() {
	loginCmd.Flags().StringVarP(&loginToken, "token", "t", "", "API Token")
	rootCmd.AddCommand(loginCmd)
}

func runLogin(cmd *cobra.Command, args []string) error {
	var token string
	var err error

	if loginToken != "" {
		token = loginToken
	} else {
		fmt.Println(ui.Header("Login to Skillz Registry"))
		fmt.Println(ui.Info("Please visit https://skillz.dev/auth/token to generate an API token."))
		fmt.Println()
		fmt.Print("Enter your API Token: ")
		reader := bufio.NewReader(os.Stdin)
		token, err = reader.ReadString('\n')
		if err != nil {
			return err
		}
		token = strings.TrimSpace(token)
	}

	if token == "" {
		return fmt.Errorf("token is required")
	}

	// TODO: Validate token with API?
	// For now, just save it.

	// Save credentials
	creds := auth.Credentials{
		Token: token,
		// Username is not strictly needed for token auth, but maybe we can fetch it later
		Username: "user", // Placeholder
	}

	if err := auth.SaveCredentials(creds); err != nil {
		return fmt.Errorf("failed to save credentials: %w", err)
	}

	fmt.Println()
	fmt.Println(ui.Success("Successfully logged in!"))
	return nil
}
