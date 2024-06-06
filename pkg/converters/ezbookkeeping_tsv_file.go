package converters

import (
	"time"

	"github.com/hocx/ezbookkeeping/pkg/models"
)

// EzBookKeepingTSVFileExporter defines the structure of TSV file exporter
type EzBookKeepingTSVFileExporter struct {
	EzBookKeepingPlainFileExporter
}

// ToExportedContent returns the exported TSV data
func (e *EzBookKeepingTSVFileExporter) ToExportedContent(uid int64, timezone *time.Location, transactions []*models.Transaction, accountMap map[int64]*models.Account, categoryMap map[int64]*models.TransactionCategory, tagMap map[int64]*models.TransactionTag, allTagIndexs map[int64][]int64) ([]byte, error) {
	return e.toExportedContent(uid, "\t", timezone, transactions, accountMap, categoryMap, tagMap, allTagIndexs)
}
