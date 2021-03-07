package models

// LatestExchangeRateResponse returns a view-object which contains latest exchange rate
type LatestExchangeRateResponse struct {
	DataSource    string                `json:"dataSource"`
	ReferenceUrl  string                `json:"referenceUrl"`
	UpdateTime    int64                 `json:"updateTime"`
	BaseCurrency  string                `json:"baseCurrency"`
	ExchangeRates []*LatestExchangeRate `json:"exchangeRates"`
}

// LatestExchangeRate represents a data pair of currency and exchange rate
type LatestExchangeRate struct {
	Currency string `json:"currency"`
	Rate     string `json:"rate"`
}
