package personas

import (
	"math"
	"strings"
	"testing"
)

func flat(handle string, v float64) Profile {
	p := Profile{Handle: handle, Name: strings.ToUpper(handle), Bio: handle + " bio", Craft: handle + " craft", Domains: map[string]float64{}, Facets: map[string]float64{}}
	for _, d := range Domains {
		p.Domains[d] = v
		for _, f := range Facets[d] {
			p.Facets[f] = v
		}
	}
	return p
}

func near(a, b float64) bool { return math.Abs(a-b) < 1e-12 }

// TestBlendIsTheWeightedMean holds Blend to its arithmetic: the domains and the
// facets are the weighted mean, the weights become shares that sum to 1, and a
// zero weight is the unset one, so no weights is the equal blend.
func TestBlendIsTheWeightedMean(t *testing.T) {
	b, err := Blend([]Part{{flat("aa", 0.2), 1}, {flat("bb", 0.6), 3}})
	if err != nil {
		t.Fatal(err)
	}
	for _, d := range Domains {
		if !near(b.Domains[d], 0.5) {
			t.Errorf("%s = %v, want 0.5", d, b.Domains[d])
		}
	}
	if !near(b.Facets["fantasy"], 0.5) || len(b.Facets) != 30 {
		t.Errorf("facets = %v", b.Facets)
	}
	if b.Source != "exemplars" || len(b.Exemplars) != 2 || b.Exemplars[0].Weight != 0.25 || b.Exemplars[1].Weight != 0.75 || b.Exemplars[1].Craft != "bb craft" {
		t.Errorf("exemplars = %+v", b.Exemplars)
	}
	equal, err := Blend([]Part{{Profile: flat("aa", 0.1)}, {Profile: flat("bb", 0.4)}, {Profile: flat("cc", 0.7)}})
	if err != nil {
		t.Fatal(err)
	}
	if !near(equal.Domains["openness"], 0.4) || !near(equal.Exemplars[2].Weight, 1.0/3) {
		t.Errorf("equal blend = %v %+v", equal.Domains, equal.Exemplars)
	}
}

// TestBlendRefuses holds Blend to what it will not average.
func TestBlendRefuses(t *testing.T) {
	fewer := flat("bb", 0.5)
	delete(fewer.Facets, "fantasy")
	noScore := flat("bb", 0.5)
	delete(noScore.Domains, "neuroticism")
	living := flat("ll", 0.5)
	living.Living = true
	unsigned := living
	unsigned.Consent = "recorded"
	for name, parts := range map[string][]Part{
		"none":              nil,
		"negative weight":   {{flat("aa", 0.5), -1}},
		"infinite weight":   {{flat("aa", 0.5), math.Inf(1)}},
		"listed twice":      {{Profile: flat("aa", 0.5)}, {Profile: flat("aa", 0.6)}},
		"no domain score":   {{Profile: flat("aa", 0.5)}, {Profile: noScore}},
		"different facets":  {{Profile: flat("aa", 0.5)}, {Profile: fewer}},
		"living, no record": {{Profile: living}},
		"living, no signer": {{Profile: unsigned}},
	} {
		if _, err := Blend(parts); err == nil {
			t.Errorf("%s: Blend accepted it", name)
		}
	}
	signed := unsigned
	signed.ConsentBy = "sub-1"
	if _, err := Blend([]Part{{Profile: signed}}); err != nil {
		t.Errorf("a living person who recorded consent is refused: %v", err)
	}
}

// TestALivingFigureIsRefused reads the rule off the roster: a figure without a
// died year is a living person, and a blend refuses one who has not consented.
func TestALivingFigureIsRefused(t *testing.T) {
	torvalds, err := Figure("torvalds")
	if err != nil {
		t.Fatal(err)
	}
	if !torvalds.Living || torvalds.Consent == "recorded" {
		t.Fatalf("torvalds = living %v, consent %q", torvalds.Living, torvalds.Consent)
	}
	ogilvy, err := Figure("david_ogilvy")
	if err != nil {
		t.Fatal(err)
	}
	if ogilvy.Living || ogilvy.Handle != "david-ogilvy" || ogilvy.Craft == "" || len(ogilvy.Facets) != 30 || len(ogilvy.Sources) < 2 {
		t.Fatalf("ogilvy = %+v", ogilvy)
	}
	if _, err := Blend([]Part{{Profile: ogilvy}, {Profile: torvalds}}); err == nil || !strings.Contains(err.Error(), "torvalds is a living person") {
		t.Fatalf("blend with torvalds: %v", err)
	}
	if _, err := Figure("../team/dev"); err != ErrNoFigure {
		t.Fatalf("a path is not an id: %v", err)
	}
}

// TestSeatsAreTheirExemplars holds every seat to its source: three or more
// exemplars, each a written figure who has died, and the seat's five scores the
// equal blend of theirs as the file rounds it.
func TestSeatsAreTheirExemplars(t *testing.T) {
	team, err := Team()
	if err != nil {
		t.Fatal(err)
	}
	for _, m := range team {
		if m.Profile != "exemplars" || len(m.Exemplars) < 3 {
			t.Errorf("%s: profile %q, exemplars %v", m.ID, m.Profile, m.Exemplars)
			continue
		}
		parts := make([]Part, 0, len(m.Exemplars))
		for _, id := range m.Exemplars {
			f, err := Figure(id)
			if err != nil {
				t.Errorf("%s: exemplar %s: %v", m.ID, id, err)
				continue
			}
			if f.Living || f.Bio == "" || f.Craft == "" || len(f.Facets) != 30 || len(f.Sources) < 2 {
				t.Errorf("%s: exemplar %s is not a complete figure who has died", m.ID, id)
			}
			parts = append(parts, Part{Profile: f})
		}
		b, err := Blend(parts)
		if err != nil {
			t.Errorf("%s: %v", m.ID, err)
			continue
		}
		for _, d := range Domains {
			if math.Abs(m.Ocean[d]-b.Domains[d]) > 0.005+1e-9 {
				t.Errorf("%s: %s %.2f, the blend of its exemplars is %.4f", m.ID, d, m.Ocean[d], b.Domains[d])
			}
		}
		if !strings.Contains(m.Instructions, "\nexemplars: ") || !strings.Contains(m.Instructions, "you are a Hanzo agent, not them, and never claim their memories, quotes or acts.") {
			t.Errorf("%s: the instructions do not name its exemplars", m.ID)
		}
	}
}
