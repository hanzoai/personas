package personas

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// TestTeam checks what a consumer relies on: thirty-four members, each named for a
// person to read, keyed by a permanent lower-case handle, on an Enso tier, with a
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
	if got, want := strings.Join(ids, ","), "art,biz,cyber,data,des,dev,doc,edu,fin,gov,huma,lang,law,mana,mark,mu,opera,rev,sal,sci,su,vi,vid"; got != want {
		t.Fatalf("team = %s, want %s", got, want)
	}
	word := regexp.MustCompile(`^[A-Z][A-Za-z]+$`)
	handle := regexp.MustCompile(`^[a-z]+$`)
	enso := regexp.MustCompile(`^enso(-[a-z]+)?$`)
	roles := map[string]string{}
	byID := map[string]Member{}
	for _, m := range team {
		byID[m.ID] = m
		if !word.MatchString(m.Name) {
			t.Errorf("%s: name %q is not a capitalized word", m.ID, m.Name)
		}
		if !handle.MatchString(m.ID) {
			t.Errorf("%s: handle is not lower-case letters", m.ID)
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
		if m.Lead != (m.Seat <= 12) {
			t.Errorf("%s: seat %d, lead %v: the first twelve seats are the grid", m.ID, m.Seat, m.Lead)
		}
	}
	// The owner's names: the role shortened. The handle the seat was created
	// with stays, so tools, bindings and live seats keyed by it stay in place.
	for id, want := range map[string]struct{ name, role string }{
		"edu": {"Ed", "Education"},
		"vid": {"Mo", "Motion Pictures"},
		"art": {"Art", "Visual Art"},
	} {
		if m := byID[id]; m.Name != want.name || m.Role != want.role {
			t.Errorf("%s: name %q, role %q, want %q, %q", id, m.Name, m.Role, want.name, want.role)
		}
	}
	// The role skills the cloud attaches as skill_<name>: Ponytail's dev mode and
	// the quality review for Dev, the UI skill for Des.
	for id, want := range map[string]string{"dev": "dev,code-review", "des": "ui", "cyber": "code-review"} {
		if got := strings.Join(byID[id].Skills, ","); got != want {
			t.Errorf("%s: skills %q, want %q", id, got, want)
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
	if m.Name != "Dev" || m.Role != "Development" || m.Model != "enso" {
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
