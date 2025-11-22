package ui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// Header renders a styled section header
func Header(text string) string {
	return StyleH1.Render(IconSparkles + " " + text)
}

// SubHeader renders a styled sub-header
func SubHeader(text string) string {
	return StyleH2.Render(text)
}

// Success renders a success message with icon
func Success(message string) string {
	return StyleSuccess.Render(IconCheckmark + " " + message)
}

// Error renders an error message with icon
func Error(message string) string {
	return StyleError.Render(IconCross + " " + message)
}

// Warning renders a warning message with icon
func Warning(message string) string {
	return StyleWarning.Render(IconWarning + " " + message)
}

// Info renders an info message with icon
func Info(message string) string {
	return StyleInfo.Render(IconInfo + " " + message)
}

// Code renders inline code
func Code(text string) string {
	return StyleCode.Render(text)
}

// Box renders content in a bordered box
func Box(content string) string {
	return StyleBox.Render(content)
}

// HighlightBox renders content in a highlighted bordered box
func HighlightBox(content string) string {
	return StyleHighlightBox.Render(content)
}

// List renders a bulleted list
func List(items []string) string {
	var lines []string
	bulletStyle := lipgloss.NewStyle().Foreground(ColorPrimary)

	for _, item := range items {
		lines = append(lines, bulletStyle.Render("  •")+" "+item)
	}

	return strings.Join(lines, "\n")
}

// NumberedList renders a numbered list
func NumberedList(items []string) string {
	var lines []string
	numberStyle := lipgloss.NewStyle().Foreground(ColorPrimary).Bold(true)

	for i, item := range items {
		lines = append(lines, numberStyle.Render(fmt.Sprintf("  %d.", i+1))+" "+item)
	}

	return strings.Join(lines, "\n")
}

// Table renders a simple table with headers and rows
func Table(headers []string, rows [][]string) string {
	if len(headers) == 0 || len(rows) == 0 {
		return ""
	}

	// Calculate column widths
	colWidths := make([]int, len(headers))
	for i, h := range headers {
		colWidths[i] = lipgloss.Width(h)
	}

	for _, row := range rows {
		for i, cell := range row {
			if i < len(colWidths) {
				width := lipgloss.Width(cell)
				if width > colWidths[i] {
					colWidths[i] = width
				}
			}
		}
	}

	// Styles
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorPrimary).
		Padding(0, 1)

	cellStyle := lipgloss.NewStyle().Padding(0, 1)
	borderStyle := lipgloss.NewStyle().Foreground(ColorBorder)

	// Build table
	var lines []string

	// Header row
	var headerCells []string
	for i, h := range headers {
		headerCells = append(headerCells, headerStyle.
			Width(colWidths[i]).
			Render(h))
	}
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Top, headerCells...))

	// Separator
	var separators []string
	for _, width := range colWidths {
		separators = append(separators, borderStyle.Render(strings.Repeat("─", width+2)))
	}
	lines = append(lines, strings.Join(separators, ""))

	// Data rows
	for _, row := range rows {
		var cells []string
		for i, cell := range row {
			if i < len(colWidths) {
				cells = append(cells, cellStyle.
					Width(colWidths[i]).
					Render(cell))
			}
		}
		lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Top, cells...))
	}

	return strings.Join(lines, "\n")
}

// KeyValue renders a key-value pair
func KeyValue(key, value string) string {
	keyStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorSecondary).
		Width(15)

	return keyStyle.Render(key+":") + " " + value
}

// Divider renders a horizontal divider
func Divider() string {
	style := lipgloss.NewStyle().
		Foreground(ColorBorder).
		Width(60)

	return style.Render(strings.Repeat("─", 60))
}

// ProgressBar renders a simple progress bar
func ProgressBar(current, total int, width int) string {
	if total == 0 {
		return ""
	}

	percent := float64(current) / float64(total)
	filled := int(float64(width) * percent)
	empty := width - filled

	filledStyle := lipgloss.NewStyle().
		Foreground(ColorSuccess).
		Bold(true)

	emptyStyle := lipgloss.NewStyle().
		Foreground(ColorMuted)

	bar := filledStyle.Render(strings.Repeat("█", filled)) +
		emptyStyle.Render(strings.Repeat("░", empty))

	percentage := fmt.Sprintf(" %d%%", int(percent*100))

	return bar + lipgloss.NewStyle().Foreground(ColorInfo).Render(percentage)
}
