package api

import (
	"github.com/hocx/ezbookkeeping/pkg/core"
	"github.com/hocx/ezbookkeeping/pkg/errs"
	"github.com/hocx/ezbookkeeping/pkg/settings"
)

// HealthsApi represents health api
type HealthsApi struct{}

// Initialize a healths api singleton instance
var (
	Healths = &HealthsApi{}
)

// HealthStatusHandler returns the health status of current service
func (a *HealthsApi) HealthStatusHandler(c *core.Context) (any, *errs.Error) {
	result := make(map[string]string)

	result["version"] = settings.Version
	result["commit"] = settings.CommitHash
	result["status"] = "ok"

	return result, nil
}
