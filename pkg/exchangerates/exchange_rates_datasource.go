package exchangerates

import (
	"github.com/hocx/ezbookkeeping/pkg/core"
	"github.com/hocx/ezbookkeeping/pkg/models"
)

// ExchangeRatesDataSource defines the structure of exchange rates data source
type ExchangeRatesDataSource interface {
	// GetRequestUrl returns the data source urls
	GetRequestUrls() []string

	// Parse returns the common response entity according to the data source raw response
	Parse(c *core.Context, content []byte) (*models.LatestExchangeRateResponse, error)
}
