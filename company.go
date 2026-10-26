package personas

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
)

//go:embed company.json
var companyJSON []byte

// CompanyPolicy is guidance for the host to adopt, never an authorization grant.
type CompanyPolicy struct {
	SchemaVersion int                       `json:"schemaVersion"`
	Entrypoint    string                    `json:"entrypoint"`
	Rules         []string                  `json:"rules"`
	Members       map[string]FunctionPolicy `json:"members"`
}

type FunctionPolicy struct {
	Model           string   `json:"model,omitempty"`
	Boundary        string   `json:"boundary"`
	SuccessMeasures []string `json:"successMeasures"`
}

// EmployeeDefault preserves the persona and adds company operating guidance.
type EmployeeDefault struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Group            string   `json:"group"`
	Seat             int      `json:"seat"`
	Role             string   `json:"role"`
	Owns             string   `json:"owns"`
	Model            string   `json:"model"`
	EnabledByDefault bool     `json:"enabledByDefault"`
	ReportsTo        string   `json:"reportsTo"`
	RequestedTools   []string `json:"requestedTools"`
	SuccessMeasures  []string `json:"successMeasures"`
	Instructions     string   `json:"instructions"`
}

type CompanyBundle struct {
	SchemaVersion int               `json:"schemaVersion"`
	Entrypoint    string            `json:"entrypoint"`
	Members       []EmployeeDefault `json:"members"`
}

// ReadCompanyPolicy returns a fresh value, so one caller cannot change another's defaults.
func ReadCompanyPolicy() (CompanyPolicy, error) {
	var policy CompanyPolicy
	if err := json.Unmarshal(companyJSON, &policy); err != nil {
		return policy, fmt.Errorf("personas: company policy: %w", err)
	}
	if policy.SchemaVersion != 1 || policy.Entrypoint != "vi" {
		return policy, fmt.Errorf("personas: unsupported company policy")
	}
	return policy, nil
}

// CompanyDefaults is an opt-in bundle. Team and Parse still return the raw persona.
// The host must enforce identity, permissions, independent audit reporting and budgets.
func CompanyDefaults() (CompanyBundle, error) {
	policy, err := ReadCompanyPolicy()
	if err != nil {
		return CompanyBundle{}, err
	}
	team, err := Team()
	if err != nil {
		return CompanyBundle{}, err
	}
	if len(team) != len(policy.Members) {
		return CompanyBundle{}, fmt.Errorf("personas: company policy must match the member roster exactly")
	}
	out := CompanyBundle{SchemaVersion: 1, Entrypoint: policy.Entrypoint, Members: make([]EmployeeDefault, 0, len(team))}
	for _, m := range team {
		own, ok := policy.Members[m.ID]
		if !ok {
			return CompanyBundle{}, fmt.Errorf("personas: no company policy for %s", m.ID)
		}
		model := m.Model
		if own.Model != "" {
			model = own.Model
		}
		reportsTo := "vi"
		if m.ID == "audit" {
			reportsTo = "human-owner"
		}
		instructions := m.Instructions + "\n\nCompany operating rules:\n- " + strings.Join(policy.Rules, "\n- ") + "\nFunction boundary: " + own.Boundary + "\nSuccess measures: " + strings.Join(own.SuccessMeasures, "; ") + "."
		out.Members = append(out.Members, EmployeeDefault{
			ID: m.ID, Name: m.Name, Group: m.Group, Seat: m.Seat, Role: m.Role, Owns: m.Owns, Model: model,
			ReportsTo: reportsTo, RequestedTools: append([]string{}, m.Tools...), SuccessMeasures: own.SuccessMeasures, Instructions: instructions,
		})
	}
	return out, nil
}
