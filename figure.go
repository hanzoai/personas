package personas

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"path"
	"regexp"
	"strconv"
	"strings"
)

//go:embed personas/*/PERSONA.md
var figures embed.FS

var figureID = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]*$`)

// ErrNoFigure is a roster id with no written PERSONA.md.
var ErrNoFigure = errors.New("personas: no such figure")

// Figure is the written figure personas/<id>/PERSONA.md as a Profile.
func Figure(id string) (Profile, error) {
	if !figureID.MatchString(id) {
		return Profile{}, ErrNoFigure
	}
	raw, err := figures.ReadFile(path.Join("personas", id, "PERSONA.md"))
	if errors.Is(err, fs.ErrNotExist) {
		return Profile{}, ErrNoFigure
	}
	if err != nil {
		return Profile{}, fmt.Errorf("personas: read %s: %w", id, err)
	}
	return ParseFigure(id, string(raw))
}

// node is one value of a PERSONA.md front matter: a scalar, a list or a map.
type node struct {
	text string
	list []string
	kids map[string]*node
}

func (n *node) get(k string) *node {
	if n == nil || n.kids == nil {
		return nil
	}
	return n.kids[k]
}

func (n *node) entries() map[string]*node {
	if n == nil {
		return nil
	}
	return n.kids
}

func (n *node) str() string {
	if n == nil {
		return ""
	}
	return n.text
}

// block reads the lines from *i that are indented at least indent, nested by
// indentation: the YAML subset the files are written in (figure.ts).
func block(lines []string, i *int, indent int) *node {
	n := &node{kids: map[string]*node{}}
	for *i < len(lines) {
		line := lines[*i]
		text := strings.TrimSpace(line)
		if text == "" {
			*i++
			continue
		}
		if len(line)-len(strings.TrimLeft(line, " ")) < indent {
			break
		}
		lead := len(line) - len(strings.TrimLeft(line, " "))
		*i++
		if item, ok := strings.CutPrefix(text, "- "); ok {
			n.list = append(n.list, strings.TrimSpace(item))
			continue
		}
		k, v, ok := strings.Cut(text, ":")
		if !ok || strings.TrimSpace(k) == "" {
			continue
		}
		if v = strings.TrimSpace(v); v == "" {
			n.kids[strings.TrimSpace(k)] = block(lines, i, lead+1)
		} else {
			n.kids[strings.TrimSpace(k)] = scalar(v)
		}
	}
	return n
}

func scalar(v string) *node {
	if strings.HasPrefix(v, "[") && strings.HasSuffix(v, "]") {
		n := &node{}
		for _, x := range strings.Split(v[1:len(v)-1], ",") {
			if x = strings.TrimSpace(x); x != "" {
				n.list = append(n.list, x)
			}
		}
		return n
	}
	if len(v) >= 2 && (v[0] == '"' || v[0] == '\'') && v[len(v)-1] == v[0] {
		v = v[1 : len(v)-1]
	}
	return &node{text: v}
}

var sourceLine = regexp.MustCompile(`^\d+\.\s+(.+)$`)

// ParseFigure reads one figure from the text of personas/<id>/PERSONA.md. A
// figure with a `died` year is historical; one without is a living person,
// with the consent its `consent` and `consent_by` lines record.
func ParseFigure(id, text string) (Profile, error) {
	rest, ok := strings.CutPrefix(text, "---\n")
	if !ok {
		return Profile{}, fmt.Errorf("personas: personas/%s/PERSONA.md has no front matter", id)
	}
	head, body, ok := strings.Cut(rest, "\n---\n")
	if !ok {
		return Profile{}, fmt.Errorf("personas: personas/%s/PERSONA.md has no front matter", id)
	}
	i := 0
	meta := block(strings.Split(head, "\n"), &i, 0)
	p := Profile{
		Handle:  strings.ReplaceAll(id, "_", "-"),
		Name:    meta.get("name").str(),
		Bio:     meta.get("bio").str(),
		Craft:   meta.get("craft").str(),
		Domains: map[string]float64{},
		Source:  "authored",
	}
	if p.Name == "" {
		return Profile{}, fmt.Errorf("personas: personas/%s/PERSONA.md has no name", id)
	}
	for _, d := range Domains {
		if v, err := strconv.ParseFloat(meta.get("traits").get(d).str(), 64); err == nil {
			p.Domains[d] = v
		}
	}
	for _, d := range Domains {
		for f, v := range meta.get("trait_facets").get(d).entries() {
			if x, err := strconv.ParseFloat(v.str(), 64); err == nil {
				if p.Facets == nil {
					p.Facets = map[string]float64{}
				}
				p.Facets[f] = x
			}
		}
	}
	if _, err := strconv.Atoi(meta.get("died").str()); err != nil {
		p.Living = true
		p.Consent = meta.get("consent").str()
		p.ConsentBy = meta.get("consent_by").str()
	}
	if at := strings.Index(body, "\n## Sources\n"); at >= 0 {
		for _, line := range strings.Split(body[at+len("\n## Sources\n"):], "\n") {
			if strings.HasPrefix(line, "#") {
				break
			}
			if m := sourceLine.FindStringSubmatch(line); m != nil {
				p.Sources = append(p.Sources, strings.TrimSpace(m[1]))
			}
		}
	}
	return p, nil
}
