package converters

import (
	"time"

	"github.com/hocx/ezbookkeeping/pkg/models"
)

// DataConverter defines the structure of data exporter
type DataConverter interface {
	// ToExportedContent returns the exported data
	ToExportedContent(uid int64, timezone *time.Location, transactions []*models.Transaction, accountMap map[int64]*models.Account, categoryMap map[int64]*models.TransactionCategory, tagMap map[int64]*models.TransactionTag, allTagIndexs map[int64][]int64) ([]byte, error)
}
