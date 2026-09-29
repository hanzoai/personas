package personas

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// TestTeam checks what a consumer relies on: eight members, each named for a
// person to read, keyed by the lower-case handle, on an Enso tier, with a
// system prompt that opens with the member's own name.
func TestTeam(t *testing.T) {
	team, err := Team()
	if err != nil {
		t.Fatal(err)
	}
	var ids []string
	for _, m := range team {
		ids = append(ids, m.ID)
	}
	if got, want := strings.Join(ids, ","), "des,dev,einstein,feynman,leo,maya,nora,vi"; got != want {
		t.Fatalf("team = %s, want %s", got, want)
	}
	word := regexp.MustCompile(`^[A-Z][a-z]+$`)
	enso := regexp.MustCompile(`^enso(-[a-z]+)?$`)
	roles := map[string]string{}
	for _, m := range team {
		if !word.MatchString(m.Name) || strings.ToLower(m.Name) != m.ID {
			t.Errorf("%s: name %q is not the capitalized handle", m.ID, m.Name)
		}
		if !enso.MatchString(m.Model) {
			t.Errorf("%s: model %q is not an Enso tier", m.ID, m.Model)
		}
		if !strings.HasPrefix(m.Instructions, "You are "+m.Name+",") {
			t.Errorf("%s: instructions open %q", m.ID, m.Instructions[:min(40, len(m.Instructions))])
		}
		if other, dup := roles[m.Role]; dup {
			t.Errorf("%s and %s share the role %q", other, m.ID, m.Role)
		}
		roles[m.Role] = m.ID
		if m.Persona != "" {
			if _, err := os.Stat(filepath.Join("personas", m.Persona, "profile.json")); err != nil {
				t.Errorf("%s: persona %q is not in the roster", m.ID, m.Persona)
			}
		}
	}
}

// TestParseMatchesTheFile holds Parse to the file: the body after the front
// matter is the instructions, whole.
func TestParseMatchesTheFile(t *testing.T) {
	raw, err := os.ReadFile(filepath.Join("team", "dev.md"))
	if err != nil {
		t.Fatal(err)
	}
	m, err := Parse("dev", string(raw))
	if err != nil {
		t.Fatal(err)
	}
	_, body, _ := strings.Cut(strings.TrimPrefix(string(raw), "---\n"), "\n---\n")
	if m.Instructions != strings.TrimSpace(body) {
		t.Fatal("instructions differ from the file's body")
	}
	if m.Name != "Dev" || m.Role != "Engineer" || m.Model != "enso" || m.Persona != "" {
		t.Fatalf("dev = %+v", m)
	}
}

func TestParseRefuses(t *testing.T) {
	for name, text := range map[string]string{
		"no front matter": "You are nobody.",
		"unclosed":        "---\nname: X\n",
		"no model":        "---\nname: X\nrole: Y\n---\nYou are X,",
	} {
		if _, err := Parse("x", text); err == nil {
			t.Errorf("%s: Parse accepted it", name)
		}
	}
}
