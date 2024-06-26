package exchangerates

import (
	"github.com/kyy-me/ezbookkeeping/pkg/errs"
	"github.com/kyy-me/ezbookkeeping/pkg/settings"
)

// ExchangeRatesDataSourceContainer contains the current exchange rates data source
type ExchangeRatesDataSourceContainer struct {
	Current ExchangeRatesDataSource
}

// Initialize a exchange rates data source container singleton instance
var (
	Container = &ExchangeRatesDataSourceContainer{}
)

// InitializeExchangeRatesDataSource initializes the current exchange rates data source according to the config
func InitializeExchangeRatesDataSource(config *settings.Config) error {
	if config.ExchangeRatesDataSource == settings.EuroCentralBankDataSource {
		Container.Current = &EuroCentralBankDataSource{}
		return nil
	} else if config.ExchangeRatesDataSource == settings.BankOfCanadaDataSource {
		Container.Current = &BankOfCanadaDataSource{}
		return nil
	} else if config.ExchangeRatesDataSource == settings.ReserveBankOfAustraliaDataSource {
		Container.Current = &ReserveBankOfAustraliaDataSource{}
		return nil
	} else if config.ExchangeRatesDataSource == settings.CzechNationalBankDataSource {
		Container.Current = &CzechNationalBankDataSource{}
		return nil
	} else if config.ExchangeRatesDataSource == settings.NationalBankOfPolandDataSource {
		Container.Current = &NationalBankOfPolandDataSource{}
		return nil
	} else if config.ExchangeRatesDataSource == settings.MonetaryAuthorityOfSingaporeDataSource {
		Container.Current = &MonetaryAuthorityOfSingaporeDataSource{}
		return nil
	}

	return errs.ErrInvalidExchangeRatesDataSource
}
