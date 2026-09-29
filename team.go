// Package personas carries Hanzo's core agent team as data: one markdown file
// per member under team/. The front matter says who the member is; the body is
// the system prompt that reaches the model, word for word. team.js reads the
// same files for JavaScript.
package personas

import (
	"embed"
	"fmt"
	"path"
	"sort"
	"strings"
)

//go:embed team/*.md
var files embed.FS

// Member is one member of the core agent team, from team/<id>.md.
type Member struct {
	// ID is the file's name and the member's stable handle: "dev".
	ID string
	// Name is the name a person sees: "Dev".
	Name string
	// Role is the member's part on the team: "Engineer".
	Role string
	// Model is the model the member runs on: an Enso tier.
	Model string
	// Persona is the slug under personas/ the member is modelled on, or "".
	Persona string
	// Instructions is the system prompt, word for word.
	Instructions string
}

// Team returns the core agent team, sorted by ID.
func Team() ([]Member, error) {
	entries, err := files.ReadDir("team")
	if err != nil {
		return nil, fmt.Errorf("personas: read team: %w", err)
	}
	out := make([]Member, 0, len(entries))
	for _, e := range entries {
		id, ok := strings.CutSuffix(e.Name(), ".md")
		if !ok {
			continue
		}
		raw, err := files.ReadFile(path.Join("team", e.Name()))
		if err != nil {
			return nil, fmt.Errorf("personas: read team/%s: %w", e.Name(), err)
		}
		m, err := Parse(id, string(raw))
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// Parse reads one member from the text of team/<id>.md: flat "key: value"
// front matter between two "---" lines, then the body. A file with no name,
// role or model is an error.
func Parse(id, text string) (Member, error) {
	rest, ok := strings.CutPrefix(text, "---\n")
	if !ok {
		return Member{}, fmt.Errorf("personas: team/%s.md has no front matter", id)
	}
	head, body, ok := strings.Cut(rest, "\n---\n")
	if !ok {
		return Member{}, fmt.Errorf("personas: team/%s.md has no front matter", id)
	}
	meta := map[string]string{}
	for _, line := range strings.Split(head, "\n") {
		if k, v, ok := strings.Cut(line, ":"); ok && strings.TrimSpace(k) != "" {
			meta[strings.TrimSpace(k)] = strings.TrimSpace(v)
		}
	}
	for _, k := range []string{"name", "role", "model"} {
		if meta[k] == "" {
			return Member{}, fmt.Errorf("personas: team/%s.md has no %s", id, k)
		}
	}
	return Member{
		ID:           id,
		Name:         meta["name"],
		Role:         meta["role"],
		Model:        meta["model"],
		Persona:      meta["persona"],
		Instructions: strings.TrimSpace(body),
	}, nil
}
