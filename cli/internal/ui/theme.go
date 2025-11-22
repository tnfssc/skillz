package ui

import (
	"github.com/charmbracelet/lipgloss"
)

// Color palette
var (
	// Brand colors
	ColorPrimary   = lipgloss.Color("#FF6B9D")
	ColorSecondary = lipgloss.Color("#C792EA")
	ColorAccent    = lipgloss.Color("#82AAFF")

	// Status colors
	ColorSuccess = lipgloss.Color("#C3E88D")
	ColorError   = lipgloss.Color("#FF5370")
	ColorWarning = lipgloss.Color("#FFCB6B")
	ColorInfo    = lipgloss.Color("#89DDFF")

	// UI colors
	ColorMuted  = lipgloss.Color("#697098")
	ColorBorder = lipgloss.Color("#464B5D")
	ColorSubtle = lipgloss.Color("#C792EA")
)

// Base styles
var (
	// Text styles
	StyleBold      = lipgloss.NewStyle().Bold(true)
	StyleItalic    = lipgloss.NewStyle().Italic(true)
	StyleUnderline = lipgloss.NewStyle().Underline(true)
	StyleMuted     = lipgloss.NewStyle().Foreground(ColorMuted)

	// Headings
	StyleH1 = lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorPrimary).
		MarginTop(1).
		MarginBottom(1)

	StyleH2 = lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorSecondary).
		MarginTop(1)

	StyleH3 = lipgloss.NewStyle().
		Foreground(ColorAccent).
		MarginTop(1)

	// Status styles
	StyleSuccess = lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Bold(true)

	StyleError = lipgloss.NewStyle().
			Foreground(ColorError).
			Bold(true)

	StyleWarning = lipgloss.NewStyle().
			Foreground(ColorWarning).
			Bold(true)

	StyleInfo = lipgloss.NewStyle().
			Foreground(ColorInfo)

	// Code/inline
	StyleCode = lipgloss.NewStyle().
			Foreground(ColorAccent).
			Background(lipgloss.Color("#1E1E2E")).
			Padding(0, 1)

	// Boxes
	StyleBox = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorBorder).
			Padding(1, 2)

	StyleHighlightBox = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorPrimary).
				Padding(1, 2)
)

// Emoji/Icons
const (
	IconSparkles  = "✨"
	IconPackage   = "📦"
	IconRocket    = "🚀"
	IconCheckmark = "✅"
	IconCross     = "❌"
	IconWarning   = "⚠️"
	IconInfo      = "ℹ️"
	IconDownload  = "📥"
	IconUpload    = "📤"
	IconSearch    = "🔍"
	IconList      = "📋"
	IconTrash     = "🗑️"
	IconUpdate    = "🔄"
	IconGit       = "🔗"
	IconClock     = "⏱️"
	IconStar      = "⭐"
)
