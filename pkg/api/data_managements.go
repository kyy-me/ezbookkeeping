package api

import (
	"fmt"
	"strings"
	"time"

	"github.com/hocx/ezbookkeeping/pkg/converters"
	"github.com/hocx/ezbookkeeping/pkg/core"
	"github.com/hocx/ezbookkeeping/pkg/errs"
	"github.com/hocx/ezbookkeeping/pkg/log"
	"github.com/hocx/ezbookkeeping/pkg/models"
	"github.com/hocx/ezbookkeeping/pkg/services"
	"github.com/hocx/ezbookkeeping/pkg/settings"
	"github.com/hocx/ezbookkeeping/pkg/utils"
)

const pageCountForDataExport = 1000

// DataManagementsApi represents data management api
type DataManagementsApi struct {
	ezBookKeepingCsvExporter *converters.EzBookKeepingCSVFileExporter
	ezBookKeepingTsvExporter *converters.EzBookKeepingTSVFileExporter
	tokens                   *services.TokenService
	users                    *services.UserService
	accounts                 *services.AccountService
	transactions             *services.TransactionService
	categories               *services.TransactionCategoryService
	tags                     *services.TransactionTagService
}

// Initialize a data management api singleton instance
var (
	DataManagements = &DataManagementsApi{
		ezBookKeepingCsvExporter: &converters.EzBookKeepingCSVFileExporter{},
		ezBookKeepingTsvExporter: &converters.EzBookKeepingTSVFileExporter{},
		tokens:                   services.Tokens,
		users:                    services.Users,
		accounts:                 services.Accounts,
		transactions:             services.Transactions,
		categories:               services.TransactionCategories,
		tags:                     services.TransactionTags,
	}
)

// ExportDataToEzbookkeepingCSVHandler returns exported data in csv format
func (a *DataManagementsApi) ExportDataToEzbookkeepingCSVHandler(c *core.Context) ([]byte, string, *errs.Error) {
	return a.getExportedFileContent(c, "csv")
}

// ExportDataToEzbookkeepingTSVHandler returns exported data in csv format
func (a *DataManagementsApi) ExportDataToEzbookkeepingTSVHandler(c *core.Context) ([]byte, string, *errs.Error) {
	return a.getExportedFileContent(c, "tsv")
}

// DataStatisticsHandler returns user data statistics
func (a *DataManagementsApi) DataStatisticsHandler(c *core.Context) (any, *errs.Error) {
	uid := c.GetCurrentUid()
	totalAccountCount, err := a.accounts.GetTotalAccountCountByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.DataStatisticsHandler] failed to get total account count for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	totalTransactionCategoryCount, err := a.categories.GetTotalCategoryCountByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.DataStatisticsHandler] failed to get total transaction category count for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	totalTransactionTagCount, err := a.tags.GetTotalTagCountByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.DataStatisticsHandler] failed to get total transaction tag count for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	totalTransactionCount, err := a.transactions.GetTotalTransactionCountByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.DataStatisticsHandler] failed to get total transaction count for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.ErrOperationFailed
	}

	dataStatisticsResp := &models.DataStatisticsResponse{
		TotalAccountCount:             totalAccountCount,
		TotalTransactionCategoryCount: totalTransactionCategoryCount,
		TotalTransactionTagCount:      totalTransactionTagCount,
		TotalTransactionCount:         totalTransactionCount,
	}

	return dataStatisticsResp, nil
}

// ClearDataHandler deletes all user data
func (a *DataManagementsApi) ClearDataHandler(c *core.Context) (any, *errs.Error) {
	var clearDataReq models.ClearDataRequest
	err := c.ShouldBindJSON(&clearDataReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[data_managements.ClearDataHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.WarnfWithRequestId(c, "[data_managements.ClearDataHandler] failed to get user for user \"uid:%d\", because %s", uid, err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	if !a.users.IsPasswordEqualsUserPassword(clearDataReq.Password, user) {
		return nil, errs.ErrUserPasswordWrong
	}

	err = a.transactions.DeleteAllTransactions(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ClearDataHandler] failed to delete all transactions, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	err = a.categories.DeleteAllCategories(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ClearDataHandler] failed to delete all transaction categories, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	err = a.tags.DeleteAllTags(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ClearDataHandler] failed to delete all transaction tags, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[data_managements.ClearDataHandler] user \"uid:%d\" has cleared all data", uid)
	return true, nil
}

func (a *DataManagementsApi) getExportedFileContent(c *core.Context, fileType string) ([]byte, string, *errs.Error) {
	if !settings.Container.Current.EnableDataExport {
		return nil, "", errs.ErrDataExportNotAllowed
	}

	timezone := time.Local
	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[data_managements.ExportDataHandler] cannot get client timezone offset, because %s", err.Error())
	} else {
		timezone = time.FixedZone("Client Timezone", int(utcOffset)*60)
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.WarnfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get user for user \"uid:%d\", because %s", uid, err.Error())
		}

		return nil, "", errs.ErrUserNotFound
	}

	accounts, err := a.accounts.GetAllAccountsByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get all accounts for user \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.ErrOperationFailed
	}

	categories, err := a.categories.GetAllCategoriesByUid(c, uid, 0, -1)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get categories for user \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.ErrOperationFailed
	}

	tags, err := a.tags.GetAllTagsByUid(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get tags for user \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.ErrOperationFailed
	}

	tagIndexs, err := a.tags.GetAllTagIdsOfAllTransactions(c, uid)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get tag index for user \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.ErrOperationFailed
	}

	accountMap := a.accounts.GetAccountMapByList(accounts)
	categoryMap := a.categories.GetCategoryMapByList(categories)
	tagMap := a.tags.GetTagMapByList(tags)

	allTransactions, err := a.transactions.GetAllTransactions(c, uid, pageCountForDataExport, true)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to all transactions user \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.ErrOperationFailed
	}

	var dataExporter converters.DataConverter

	if fileType == "tsv" {
		dataExporter = a.ezBookKeepingTsvExporter
	} else {
		dataExporter = a.ezBookKeepingCsvExporter
	}

	result, err := dataExporter.ToExportedContent(uid, timezone, allTransactions, accountMap, categoryMap, tagMap, tagIndexs)

	if err != nil {
		log.ErrorfWithRequestId(c, "[data_managements.ExportDataHandler] failed to get csv format exported data for \"uid:%d\", because %s", uid, err.Error())
		return nil, "", errs.Or(err, errs.ErrOperationFailed)
	}

	fileName := a.getFileName(user, timezone, fileType)

	return result, fileName, nil
}

func (a *DataManagementsApi) getFileName(user *models.User, timezone *time.Location, fileExtension string) string {
	currentTime := utils.FormatUnixTimeToLongDateTimeWithoutSecond(time.Now().Unix(), timezone)
	currentTime = strings.Replace(currentTime, "-", "_", -1)
	currentTime = strings.Replace(currentTime, " ", "_", -1)
	currentTime = strings.Replace(currentTime, ":", "_", -1)

	return fmt.Sprintf("%s_%s.%s", user.Username, currentTime, fileExtension)
}
