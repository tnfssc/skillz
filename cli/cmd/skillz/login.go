package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"syscall"

	"github.com/spf13/cobra"
	"golang.org/x/term"

	"github.com/tnfssc/skillz/cli/internal/auth"
	"github.com/tnfssc/skillz/cli/internal/registry"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Log in to the Skillz registry",
	RunE:  runLogin,
}

var (
	loginUsername string
	loginPassword string
)

func init() {
	loginCmd.Flags().StringVarP(&loginUsername, "username", "u", "", "Username")
	loginCmd.Flags().StringVarP(&loginPassword, "password", "p", "", "Password")
	rootCmd.AddCommand(loginCmd)
}

func runLogin(cmd *cobra.Command, args []string) error {
	var username, password string
	var err error

	if loginUsername != "" {
		username = loginUsername
	} else {
		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Username: ")
		username, err = reader.ReadString('\n')
		if err != nil {
			return err
		}
		username = strings.TrimSpace(username)
	}

	if loginPassword != "" {
		password = loginPassword
	} else {
		fmt.Print("Password: ")
		bytePassword, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			return err
		}
		password = string(bytePassword)
		fmt.Println() // Newline after password input
	}

	// Authenticate
	fmt.Println("Authenticating...")
	client := registry.NewClient(registryURL)
	token, err := client.Login(username, password)
	if err != nil {
		return fmt.Errorf("authentication failed: %w", err)
	}

	// Save credentials
	creds := auth.Credentials{
		Token:    token,
		Username: username,
	}

	if err := auth.SaveCredentials(creds); err != nil {
		return fmt.Errorf("failed to save credentials: %w", err)
	}

	fmt.Println("✅ Successfully logged in!")
	return nil
}
