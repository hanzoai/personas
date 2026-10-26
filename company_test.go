package personas

import (
	"strings"
	"testing"
)

func TestCompanyDefaults(t *testing.T) {
	defaults, err := CompanyDefaults()
	if err != nil {
		t.Fatal(err)
	}
	team, err := Team()
	if err != nil {
		t.Fatal(err)
	}
	if defaults.SchemaVersion != 1 || defaults.Entrypoint != "vi" || len(defaults.Members) != 32 {
		t.Fatalf("unexpected company bundle: %+v", defaults)
	}
	groups := map[string]bool{}
	for i, m := range defaults.Members {
		groups[m.Group] = true
		if m.ID == "cyber" && m.Model != "zen6-cyber" {
			t.Fatal("Cyber beta must use zen6-cyber without fallback")
		}
		if m.ID != team[i].ID || !strings.HasPrefix(m.Instructions, team[i].Instructions) {
			t.Fatalf("lost persona %s", m.ID)
		}
		if m.EnabledByDefault || len(m.RequestedTools) < 2 || len(m.SuccessMeasures) == 0 || m.Seat == 0 || m.Owns == "" {
			t.Fatalf("incomplete defaults for %s", m.ID)
		}
		if !strings.Contains(m.Instructions, "Delegation never expands authority") {
			t.Fatalf("missing authority boundary for %s", m.ID)
		}
		if m.ID == "audit" && m.ReportsTo != "human-owner" {
			t.Fatal("Audit must report independently")
		}
		if m.ID != "audit" && m.ReportsTo != "vi" {
			t.Fatalf("unexpected reporting line for %s", m.ID)
		}
	}
	if len(groups) != 6 {
		t.Fatalf("got %d departments", len(groups))
	}
}

func TestCompanyDefaultsAreIndependent(t *testing.T) {
	first, err := CompanyDefaults()
	if err != nil {
		t.Fatal(err)
	}
	first.Members[0].SuccessMeasures[0] = "changed"
	first.Members[0].RequestedTools[0] = "changed"
	second, err := CompanyDefaults()
	if err != nil {
		t.Fatal(err)
	}
	if second.Members[0].SuccessMeasures[0] == "changed" || second.Members[0].RequestedTools[0] == "changed" {
		t.Fatal("caller changed another company's defaults")
	}
}
