package personas

import (
	"errors"
	"fmt"
	"math"
	"slices"
)

// Domains are the five Big Five domains, in the order every file states them.
var Domains = []string{"openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"}

// Facets are the thirty NEO PI-R facets, six to a domain, in file order.
var Facets = map[string][]string{
	"openness":          {"fantasy", "aesthetics", "feelings", "actions", "ideas", "values"},
	"conscientiousness": {"competence", "order", "dutifulness", "achievement_striving", "self_discipline", "deliberation"},
	"extraversion":      {"warmth", "gregariousness", "assertiveness", "activity", "excitement_seeking", "positive_emotions"},
	"agreeableness":     {"trust", "straightforwardness", "altruism", "compliance", "modesty", "tender_mindedness"},
	"neuroticism":       {"anxiety", "angry_hostility", "depression", "self_consciousness", "impulsiveness", "vulnerability"},
}

// Profile is a persona as a blend reads and writes it: who it is, its scores
// (0..1) and whether it may be drawn on. A blend's own Profile has Source
// "exemplars" and lists them.
type Profile struct {
	Handle string
	Name   string
	Bio    string
	Craft  string
	// Domains are the five domain scores; Facets the facet scores, where stated.
	Domains map[string]float64
	Facets  map[string]float64
	// Source is how the scores came to be: "authored", "designed", "exemplars".
	Source string
	// Living marks a persona of a living person, who must record consent
	// (Consent "recorded", ConsentBy their IAM subject) before it is blended.
	Living    bool
	Consent   string
	ConsentBy string
	Sources   []string
	Exemplars []Exemplar
}

// Part is one profile in a blend and its weight. Weights are relative; a zero
// weight counts as 1, the equal blend.
type Part struct {
	Profile Profile
	Weight  float64
}

// Exemplar is one profile a blend is drawn from: its share of the scores (the
// shares sum to 1), its bio and its craft.
type Exemplar struct {
	Handle string
	Name   string
	Weight float64
	Bio    string
	Craft  string
}

// Blend is several profiles as one: the weighted mean of their domain scores,
// and of their facets when every part states the same facets, with each part as
// an exemplar. It refuses no parts, a negative or non-finite weight, a profile
// listed twice, a part without the five domain scores, parts stating different
// facets, and a living person who has not recorded consent. blend.ts is the same
// function in TypeScript.
func Blend(parts []Part) (Profile, error) {
	if len(parts) == 0 {
		return Profile{}, errors.New("personas: blend: no profiles")
	}
	weights := make([]float64, len(parts))
	total := 0.0
	seen := map[string]bool{}
	var facets []string
	for i, p := range parts {
		w := p.Weight
		if w == 0 {
			w = 1
		}
		if w < 0 || math.IsInf(w, 0) || math.IsNaN(w) {
			return Profile{}, fmt.Errorf("personas: blend: %s: a weight is a positive number", p.Profile.Handle)
		}
		if seen[p.Profile.Handle] {
			return Profile{}, fmt.Errorf("personas: blend: %s is listed twice", p.Profile.Handle)
		}
		seen[p.Profile.Handle] = true
		if p.Profile.Living && (p.Profile.Consent != "recorded" || p.Profile.ConsentBy == "") {
			return Profile{}, fmt.Errorf("personas: blend: %s is a living person who has not recorded consent", p.Profile.Handle)
		}
		for _, d := range Domains {
			if _, ok := p.Profile.Domains[d]; !ok {
				return Profile{}, fmt.Errorf("personas: blend: %s has no %s score", p.Profile.Handle, d)
			}
		}
		keys := make([]string, 0, len(p.Profile.Facets))
		for f := range p.Profile.Facets {
			keys = append(keys, f)
		}
		slices.Sort(keys)
		if i == 0 {
			facets = keys
		} else if !slices.Equal(keys, facets) {
			return Profile{}, fmt.Errorf("personas: blend: %s states different facets", p.Profile.Handle)
		}
		weights[i] = w
		total += w
	}
	out := Profile{Domains: map[string]float64{}, Source: "exemplars", Exemplars: make([]Exemplar, len(parts))}
	if len(facets) > 0 {
		out.Facets = map[string]float64{}
	}
	for i, p := range parts {
		share := weights[i] / total
		for _, d := range Domains {
			out.Domains[d] += share * p.Profile.Domains[d]
		}
		for _, f := range facets {
			out.Facets[f] += share * p.Profile.Facets[f]
		}
		out.Exemplars[i] = Exemplar{Handle: p.Profile.Handle, Name: p.Profile.Name, Weight: share, Bio: p.Profile.Bio, Craft: p.Profile.Craft}
	}
	return out, nil
}
