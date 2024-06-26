package api

import (
	"sort"

	orderedmap "github.com/wk8/go-ordered-map/v2"

	"github.com/kyy-me/ezbookkeeping/pkg/core"
	"github.com/kyy-me/ezbookkeeping/pkg/errs"
	"github.com/kyy-me/ezbookkeeping/pkg/log"
	"github.com/kyy-me/ezbookkeeping/pkg/models"
	"github.com/kyy-me/ezbookkeeping/pkg/services"
	"github.com/kyy-me/ezbookkeeping/pkg/utils"
)

// TransactionsApi represents transaction api
type TransactionsApi struct {
	transactions          *services.TransactionService
	transactionCategories *services.TransactionCategoryService
	transactionTags       *services.TransactionTagService
	accounts              *services.AccountService
	users                 *services.UserService
}

// Initialize a transaction api singleton instance
var (
	Transactions = &TransactionsApi{
		transactions:          services.Transactions,
		transactionCategories: services.TransactionCategories,
		transactionTags:       services.TransactionTags,
		accounts:              services.Accounts,
		users:                 services.Users,
	}
)

// TransactionCountHandler returns transaction total count of current user
func (a *TransactionsApi) TransactionCountHandler(c *core.Context) (any, *errs.Error) {
	var transactionCountReq models.TransactionCountRequest
	err := c.ShouldBindQuery(&transactionCountReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCountHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	uid := c.GetCurrentUid()

	allAccountIds, err := a.getAccountOrSubAccountIds(c, transactionCountReq.AccountId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCountHandler] get account error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	allCategoryIds, err := a.getCategoryOrSubCategoryIds(c, transactionCountReq.CategoryId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCountHandler] get transaction category error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	totalCount, err := a.transactions.GetTransactionCount(c, uid, transactionCountReq.MaxTime, transactionCountReq.MinTime, transactionCountReq.Type, allCategoryIds, allAccountIds, transactionCountReq.Keyword)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionCountHandler] failed to get transaction count for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	countResp := &models.TransactionCountResponse{
		TotalCount: totalCount,
	}

	return countResp, nil
}

// TransactionListHandler returns transaction list of current user
func (a *TransactionsApi) TransactionListHandler(c *core.Context) (any, *errs.Error) {
	var transactionListReq models.TransactionListByMaxTimeRequest
	err := c.ShouldBindQuery(&transactionListReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	allAccountIds, err := a.getAccountOrSubAccountIds(c, transactionListReq.AccountId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] get account error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	allCategoryIds, err := a.getCategoryOrSubCategoryIds(c, transactionListReq.CategoryId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionListHandler] get transaction category error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	var totalCount int64

	if transactionListReq.WithCount {
		totalCount, err = a.transactions.GetTransactionCount(c, uid, transactionListReq.MaxTime, transactionListReq.MinTime, transactionListReq.Type, allCategoryIds, allAccountIds, transactionListReq.Keyword)

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get transaction count for user \"uid:%d\", because %s", uid, err.Error())
			return nil, errs.Or(err, errs.ErrOperationFailed)
		}
	}

	transactions, err := a.transactions.GetTransactionsByMaxTime(c, uid, transactionListReq.MaxTime, transactionListReq.MinTime, transactionListReq.Type, allCategoryIds, allAccountIds, transactionListReq.Keyword, transactionListReq.Page, transactionListReq.Count, true, true)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to get transactions earlier than \"%d\" for user \"uid:%d\", because %s", transactionListReq.MaxTime, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	hasMore := false
	var nextTimeSequenceId *int64

	if len(transactions) > int(transactionListReq.Count) {
		hasMore = true
		nextTimeSequenceId = &transactions[transactionListReq.Count].TransactionTime
		transactions = transactions[:transactionListReq.Count]
	}

	transactionResult, err := a.getTransactionListResult(c, user, transactions, utcOffset, transactionListReq.TrimAccount, transactionListReq.TrimCategory, transactionListReq.TrimTag)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionListHandler] failed to assemble transaction result for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	transactionResps := &models.TransactionInfoPageWrapperResponse{
		Items: transactionResult,
	}

	if hasMore {
		transactionResps.NextTimeSequenceId = nextTimeSequenceId
	}

	if transactionListReq.WithCount {
		transactionResps.TotalCount = &totalCount
	}

	return transactionResps, nil
}

// TransactionMonthListHandler returns all transaction list of current user by month
func (a *TransactionsApi) TransactionMonthListHandler(c *core.Context) (any, *errs.Error) {
	var transactionListReq models.TransactionListInMonthByPageRequest
	err := c.ShouldBindQuery(&transactionListReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	allAccountIds, err := a.getAccountOrSubAccountIds(c, transactionListReq.AccountId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] get account error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	allCategoryIds, err := a.getCategoryOrSubCategoryIds(c, transactionListReq.CategoryId, uid)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionMonthListHandler] get transaction category error, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	transactions, err := a.transactions.GetTransactionsInMonthByPage(c, uid, transactionListReq.Year, transactionListReq.Month, transactionListReq.Type, allCategoryIds, allAccountIds, transactionListReq.Keyword)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to get transactions in month \"%d-%d\" for user \"uid:%d\", because %s", transactionListReq.Year, transactionListReq.Month, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	transactionResult, err := a.getTransactionListResult(c, user, transactions, utcOffset, transactionListReq.TrimAccount, transactionListReq.TrimCategory, transactionListReq.TrimTag)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionMonthListHandler] failed to assemble transaction result for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	transactionResps := &models.TransactionInfoPageWrapperResponse2{
		Items:      transactionResult,
		TotalCount: int64(transactionResult.Len()),
	}

	return transactionResps, nil
}

// TransactionStatisticsHandler returns transaction statistics of current user
func (a *TransactionsApi) TransactionStatisticsHandler(c *core.Context) (any, *errs.Error) {
	var statisticReq models.TransactionStatisticRequest
	err := c.ShouldBindQuery(&statisticReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionStatisticsHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionStatisticsHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	totalAmounts, err := a.transactions.GetAccountsAndCategoriesTotalIncomeAndExpense(c, uid, statisticReq.StartTime, statisticReq.EndTime, utcOffset, statisticReq.UseTransactionTimezone)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionStatisticsHandler] failed to get accounts and categories total income and expense for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	statisticResp := &models.TransactionStatisticResponse{
		StartTime: statisticReq.StartTime,
		EndTime:   statisticReq.EndTime,
	}

	statisticResp.Items = make([]*models.TransactionStatisticResponseItem, len(totalAmounts))

	for i := 0; i < len(totalAmounts); i++ {
		totalAmountItem := totalAmounts[i]
		statisticResp.Items[i] = &models.TransactionStatisticResponseItem{
			CategoryId:  totalAmountItem.CategoryId,
			AccountId:   totalAmountItem.AccountId,
			TotalAmount: totalAmountItem.Amount,
		}
	}

	return statisticResp, nil
}

// TransactionStatisticsTrendsHandler returns transaction statistics trends of current user
func (a *TransactionsApi) TransactionStatisticsTrendsHandler(c *core.Context) (any, *errs.Error) {
	var statisticTrendsReq models.TransactionStatisticTrendsRequest
	err := c.ShouldBindQuery(&statisticTrendsReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionStatisticsTrendsHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionStatisticsTrendsHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	startYear, startMonth, endYear, endMonth, err := statisticTrendsReq.GetNumericYearMonthRange()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionStatisticsTrendsHandler] cannot parse year month, because %s", err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	uid := c.GetCurrentUid()
	allMonthlyTotalAmounts, err := a.transactions.GetAccountsAndCategoriesMonthlyIncomeAndExpense(c, uid, startYear, startMonth, endYear, endMonth, utcOffset, statisticTrendsReq.UseTransactionTimezone)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionStatisticsTrendsHandler] failed to get accounts and categories total income and expense for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	statisticTrendsResp := make(models.TransactionStatisticTrendsItemSlice, 0, len(allMonthlyTotalAmounts))

	for yearMonth, monthlyTotalAmounts := range allMonthlyTotalAmounts {
		monthlyStatisticResp := &models.TransactionStatisticTrendsItem{
			Year:  yearMonth / 100,
			Month: yearMonth % 100,
			Items: make([]*models.TransactionStatisticResponseItem, len(monthlyTotalAmounts)),
		}

		for i := 0; i < len(monthlyTotalAmounts); i++ {
			totalAmountItem := monthlyTotalAmounts[i]
			monthlyStatisticResp.Items[i] = &models.TransactionStatisticResponseItem{
				CategoryId:  totalAmountItem.CategoryId,
				AccountId:   totalAmountItem.AccountId,
				TotalAmount: totalAmountItem.Amount,
			}
		}

		statisticTrendsResp = append(statisticTrendsResp, monthlyStatisticResp)
	}

	sort.Sort(statisticTrendsResp)

	return statisticTrendsResp, nil
}

// TransactionAmountsHandler returns transaction amounts of current user
func (a *TransactionsApi) TransactionAmountsHandler(c *core.Context) (any, *errs.Error) {
	var transactionAmountsReq models.TransactionAmountsRequest
	err := c.ShouldBindQuery(&transactionAmountsReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	requestItems, err := transactionAmountsReq.GetTransactionAmountsRequestItems()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] get request item failed, because %s", err.Error())
		return nil, errs.ErrQueryItemsInvalid
	}

	if len(requestItems) < 1 {
		log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] parse request failed, because there are no valid items")
		return nil, errs.ErrQueryItemsEmpty
	}

	if len(requestItems) > 20 {
		log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] parse request failed, because there are too many items")
		return nil, errs.ErrQueryItemsTooMuch
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()

	accounts, err := a.accounts.GetAllAccountsByUid(c, uid)
	accountMap := a.accounts.GetAccountMapByList(accounts)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionAmountsHandler] failed to get all accounts for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	amountsResp := orderedmap.New[string, *models.TransactionAmountsResponseItem]()

	for i := 0; i < len(requestItems); i++ {
		requestItem := requestItems[i]

		incomeAmounts, expenseAmounts, err := a.transactions.GetAccountsTotalIncomeAndExpense(c, uid, requestItem.StartTime, requestItem.EndTime, utcOffset, transactionAmountsReq.UseTransactionTimezone)

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.TransactionAmountsHandler] failed to get transaction amounts item for user \"uid:%d\", because %s", uid, err.Error())
			return nil, errs.Or(err, errs.ErrOperationFailed)
		}

		amountsMap := make(map[string]*models.TransactionAmountsResponseItemAmountInfo)

		for accountId, incomeAmount := range incomeAmounts {
			account, exists := accountMap[accountId]

			if !exists {
				log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] cannot find account for account \"id:%d\" of user \"uid:%d\"", accountId, uid)
				continue
			}

			totalAmounts, exists := amountsMap[account.Currency]

			if !exists {
				totalAmounts = &models.TransactionAmountsResponseItemAmountInfo{
					Currency:      account.Currency,
					IncomeAmount:  0,
					ExpenseAmount: 0,
				}
			}

			totalAmounts.IncomeAmount += incomeAmount
			amountsMap[account.Currency] = totalAmounts
		}

		for accountId, expenseAmount := range expenseAmounts {
			account, exists := accountMap[accountId]

			if !exists {
				log.WarnfWithRequestId(c, "[transactions.TransactionAmountsHandler] cannot find account for account \"id:%d\" of user \"uid:%d\"", accountId, uid)
				continue
			}

			totalAmounts, exists := amountsMap[account.Currency]

			if !exists {
				totalAmounts = &models.TransactionAmountsResponseItemAmountInfo{
					Currency:      account.Currency,
					IncomeAmount:  0,
					ExpenseAmount: 0,
				}
			}

			totalAmounts.ExpenseAmount += expenseAmount
			amountsMap[account.Currency] = totalAmounts
		}

		allTotalAmounts := make(models.TransactionAmountsResponseItemAmountInfoSlice, 0)

		for _, totalAmounts := range amountsMap {
			allTotalAmounts = append(allTotalAmounts, totalAmounts)
		}

		sort.Sort(allTotalAmounts)

		amountsResp.Set(requestItem.Name, &models.TransactionAmountsResponseItem{
			StartTime: requestItem.StartTime,
			EndTime:   requestItem.EndTime,
			Amounts:   allTotalAmounts,
		})
	}

	return amountsResp, nil
}

// TransactionGetHandler returns one specific transaction of current user
func (a *TransactionsApi) TransactionGetHandler(c *core.Context) (any, *errs.Error) {
	var transactionGetReq models.TransactionGetRequest
	err := c.ShouldBindQuery(&transactionGetReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(c, uid, transactionGetReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionGetReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		transaction = a.transactions.GetRelatedTransferTransaction(transaction)
	}

	accountIds := make([]int64, 0, 2)
	accountIds = append(accountIds, transaction.AccountId)

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		accountIds = append(accountIds, transaction.RelatedAccountId)
		accountIds = utils.ToUniqueInt64Slice(accountIds)
	}

	accountMap, err := a.accounts.GetAccountsByAccountIds(c, uid, accountIds)

	if _, exists := accountMap[transaction.AccountId]; !exists {
		log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
		return nil, errs.ErrTransactionNotFound
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		if _, exists := accountMap[transaction.RelatedAccountId]; !exists {
			log.WarnfWithRequestId(c, "[transactions.TransactionGetHandler] related account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
			return nil, errs.ErrTransactionNotFound
		}
	}

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(c, uid, []int64{transaction.TransactionId})

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	var category *models.TransactionCategory
	var tagMap map[int64]*models.TransactionTag

	if !transactionGetReq.TrimCategory {
		category, err = a.transactionCategories.GetCategoryByCategoryId(c, uid, transaction.CategoryId)

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transactions category for user \"uid:%d\", because %s", uid, err.Error())
			return nil, errs.Or(err, errs.ErrOperationFailed)
		}
	}

	if !transactionGetReq.TrimTag {
		tagMap, err = a.transactionTags.GetTagsByTagIds(c, uid, utils.ToUniqueInt64Slice(a.getTransactionTagIds(allTransactionTagIds)))

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.TransactionGetHandler] failed to get transactions tags for user \"uid:%d\", because %s", uid, err.Error())
			return nil, errs.Or(err, errs.ErrOperationFailed)
		}
	}

	transactionEditable := transaction.IsEditable(user, utcOffset, accountMap[transaction.AccountId], accountMap[transaction.RelatedAccountId])
	transactionTagIds := allTransactionTagIds[transaction.TransactionId]
	transactionResp := transaction.ToTransactionInfoResponse(transactionTagIds, transactionEditable)

	if !transactionGetReq.TrimAccount {
		if sourceAccount := accountMap[transaction.AccountId]; sourceAccount != nil {
			transactionResp.SourceAccount = sourceAccount.ToAccountInfoResponse()
		}

		if destinationAccount := accountMap[transaction.RelatedAccountId]; destinationAccount != nil {
			transactionResp.DestinationAccount = destinationAccount.ToAccountInfoResponse()
		}
	}

	if !transactionGetReq.TrimCategory {
		if category != nil {
			transactionResp.Category = category.ToTransactionCategoryInfoResponse()
		}
	}

	if !transactionGetReq.TrimTag {
		transactionResp.Tags = a.getTransactionTagInfoResponses(transactionTagIds, tagMap)
	}

	return transactionResp, nil
}

// TransactionCreateHandler saves a new transaction by request parameters for current user
func (a *TransactionsApi) TransactionCreateHandler(c *core.Context) (any, *errs.Error) {
	var transactionCreateReq models.TransactionCreateRequest
	err := c.ShouldBindJSON(&transactionCreateReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tagIds, err := utils.StringArrayToInt64Array(transactionCreateReq.TagIds)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] parse tag ids failed, because %s", err.Error())
		return nil, errs.ErrTransactionTagIdInvalid
	}

	if transactionCreateReq.Type < models.TRANSACTION_TYPE_MODIFY_BALANCE || transactionCreateReq.Type > models.TRANSACTION_TYPE_TRANSFER {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] transaction type is invalid")
		return nil, errs.ErrTransactionTypeInvalid
	}

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_MODIFY_BALANCE && transactionCreateReq.CategoryId > 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] balance modification transaction cannot set category id")
		return nil, errs.ErrBalanceModificationTransactionCannotSetCategory
	}

	if transactionCreateReq.Type != models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.DestinationAccountId != 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] non-transfer transaction destination account cannot be set")
		return nil, errs.ErrTransactionDestinationAccountCannotBeSet
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.SourceAccountId == transactionCreateReq.DestinationAccountId {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] transfer transaction source account must not be destination account")
		return nil, errs.ErrTransactionSourceAndDestinationIdCannotBeEqual
	}

	if transactionCreateReq.Type != models.TRANSACTION_TYPE_TRANSFER && transactionCreateReq.DestinationAmount != 0 {
		log.WarnfWithRequestId(c, "[transactions.TransactionCreateHandler] non-transfer transaction destination amount cannot be set")
		return nil, errs.ErrTransactionDestinationAmountCannotBeSet
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionCreateHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction := a.createNewTransactionModel(uid, &transactionCreateReq, c.ClientIP())
	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, transactionCreateReq.UtcOffset)

	if !transactionEditable {
		return nil, errs.ErrCannotCreateTransactionWithThisTransactionTime
	}

	err = a.transactions.CreateTransaction(c, transaction, tagIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionCreateHandler] failed to create transaction \"id:%d\" for user \"uid:%d\", because %s", transaction.TransactionId, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionCreateHandler] user \"uid:%d\" has created a new transaction \"id:%d\" successfully", uid, transaction.TransactionId)

	transactionResp := transaction.ToTransactionInfoResponse(tagIds, transactionEditable)

	return transactionResp, nil
}

// TransactionModifyHandler saves an existed transaction by request parameters for current user
func (a *TransactionsApi) TransactionModifyHandler(c *core.Context) (any, *errs.Error) {
	var transactionModifyReq models.TransactionModifyRequest
	err := c.ShouldBindJSON(&transactionModifyReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	tagIds, err := utils.StringArrayToInt64Array(transactionModifyReq.TagIds)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] parse tag ids failed, because %s", err.Error())
		return nil, errs.ErrTransactionTagIdInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(c, uid, transactionModifyReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		log.WarnfWithRequestId(c, "[transactions.TransactionModifyHandler] cannot modify transaction \"id:%d\" for user \"uid:%d\", because transaction type is transfer in", transactionModifyReq.Id, uid)
		return nil, errs.ErrTransactionTypeInvalid
	}

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(c, uid, []int64{transaction.TransactionId})

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	transactionTagIds := allTransactionTagIds[transaction.TransactionId]

	if transactionTagIds == nil {
		transactionTagIds = make([]int64, 0, 0)
	}

	newTransaction := &models.Transaction{
		TransactionId:     transaction.TransactionId,
		Uid:               uid,
		CategoryId:        transactionModifyReq.CategoryId,
		TransactionTime:   utils.GetMinTransactionTimeFromUnixTime(transactionModifyReq.Time),
		TimezoneUtcOffset: transactionModifyReq.UtcOffset,
		AccountId:         transactionModifyReq.SourceAccountId,
		Amount:            transactionModifyReq.SourceAmount,
		HideAmount:        transactionModifyReq.HideAmount,
		Comment:           transactionModifyReq.Comment,
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
		newTransaction.RelatedAccountId = transactionModifyReq.DestinationAccountId
		newTransaction.RelatedAccountAmount = transactionModifyReq.DestinationAmount
	}

	if transactionModifyReq.GeoLocation != nil {
		newTransaction.GeoLongitude = transactionModifyReq.GeoLocation.Longitude
		newTransaction.GeoLatitude = transactionModifyReq.GeoLocation.Latitude
	}

	if newTransaction.CategoryId == transaction.CategoryId &&
		utils.GetUnixTimeFromTransactionTime(newTransaction.TransactionTime) == utils.GetUnixTimeFromTransactionTime(transaction.TransactionTime) &&
		newTransaction.TimezoneUtcOffset == transaction.TimezoneUtcOffset &&
		newTransaction.AccountId == transaction.AccountId &&
		newTransaction.Amount == transaction.Amount &&
		(transaction.Type != models.TRANSACTION_DB_TYPE_TRANSFER_OUT || newTransaction.RelatedAccountId == transaction.RelatedAccountId) &&
		(transaction.Type != models.TRANSACTION_DB_TYPE_TRANSFER_OUT || newTransaction.RelatedAccountAmount == transaction.RelatedAccountAmount) &&
		newTransaction.HideAmount == transaction.HideAmount &&
		newTransaction.Comment == transaction.Comment &&
		newTransaction.GeoLongitude == transaction.GeoLongitude &&
		newTransaction.GeoLatitude == transaction.GeoLatitude &&
		utils.Int64SliceEquals(tagIds, transactionTagIds) {
		return nil, errs.ErrNothingWillBeUpdated
	}

	var addTransactionTagIds []int64
	var removeTransactionTagIds []int64

	if !utils.Int64SliceEquals(tagIds, transactionTagIds) {
		removeTransactionTagIds = transactionTagIds
		addTransactionTagIds = tagIds
	}

	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, transaction.TimezoneUtcOffset)
	newTransactionEditable := user.CanEditTransactionByTransactionTime(newTransaction.TransactionTime, transactionModifyReq.UtcOffset)

	if !transactionEditable || !newTransactionEditable {
		return nil, errs.ErrCannotModifyTransactionWithThisTransactionTime
	}

	err = a.transactions.ModifyTransaction(c, newTransaction, addTransactionTagIds, removeTransactionTagIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionModifyHandler] failed to update transaction \"id:%d\" for user \"uid:%d\", because %s", transactionModifyReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionModifyHandler] user \"uid:%d\" has updated transaction \"id:%d\" successfully", uid, transactionModifyReq.Id)

	newTransaction.Type = transaction.Type
	newTransactionResp := newTransaction.ToTransactionInfoResponse(tagIds, transactionEditable)

	return newTransactionResp, nil
}

// TransactionDeleteHandler deletes an existed transaction by request parameters for current user
func (a *TransactionsApi) TransactionDeleteHandler(c *core.Context) (any, *errs.Error) {
	var transactionDeleteReq models.TransactionDeleteRequest
	err := c.ShouldBindJSON(&transactionDeleteReq)

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] parse request failed, because %s", err.Error())
		return nil, errs.NewIncompleteOrIncorrectSubmissionError(err)
	}

	utcOffset, err := c.GetClientTimezoneOffset()

	if err != nil {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] cannot get client timezone offset, because %s", err.Error())
		return nil, errs.ErrClientTimezoneOffsetInvalid
	}

	uid := c.GetCurrentUid()
	user, err := a.users.GetUserById(c, uid)

	if err != nil {
		if !errs.IsCustomError(err) {
			log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to get user, because %s", err.Error())
		}

		return nil, errs.ErrUserNotFound
	}

	transaction, err := a.transactions.GetTransactionByTransactionId(c, uid, transactionDeleteReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to get transaction \"id:%d\" for user \"uid:%d\", because %s", transactionDeleteReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
		log.WarnfWithRequestId(c, "[transactions.TransactionDeleteHandler] cannot delete transaction \"id:%d\" for user \"uid:%d\", because transaction type is transfer in", transactionDeleteReq.Id, uid)
		return nil, errs.ErrTransactionTypeInvalid
	}

	transactionEditable := user.CanEditTransactionByTransactionTime(transaction.TransactionTime, utcOffset)

	if !transactionEditable {
		return nil, errs.ErrCannotDeleteTransactionWithThisTransactionTime
	}

	err = a.transactions.DeleteTransaction(c, uid, transactionDeleteReq.Id)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.TransactionDeleteHandler] failed to delete transaction \"id:%d\" for user \"uid:%d\", because %s", transactionDeleteReq.Id, uid, err.Error())
		return nil, errs.Or(err, errs.ErrOperationFailed)
	}

	log.InfofWithRequestId(c, "[transactions.TransactionDeleteHandler] user \"uid:%d\" has deleted transaction \"id:%d\"", uid, transactionDeleteReq.Id)
	return true, nil
}

func (a *TransactionsApi) filterTransactions(c *core.Context, uid int64, transactions []*models.Transaction, accountMap map[int64]*models.Account) []*models.Transaction {
	finalTransactions := make([]*models.Transaction, 0, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transaction := transactions[i]

		if _, exists := accountMap[transaction.AccountId]; !exists {
			log.WarnfWithRequestId(c, "[transactions.filterTransactions] account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
			continue
		}

		if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN || transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
			if _, exists := accountMap[transaction.RelatedAccountId]; !exists {
				log.WarnfWithRequestId(c, "[transactions.filterTransactions] related account of transaction \"id:%d\" does not exist for user \"uid:%d\"", transaction.TransactionId, uid)
				continue
			}
		}

		finalTransactions = append(finalTransactions, transaction)
	}

	return finalTransactions
}

func (a *TransactionsApi) getAccountOrSubAccountIds(c *core.Context, accountId int64, uid int64) ([]int64, error) {
	var allAccountIds []int64

	if accountId > 0 {
		allSubAccounts, err := a.accounts.GetSubAccountsByAccountId(c, uid, accountId)

		if err != nil {
			return nil, err
		}

		if len(allSubAccounts) > 0 {
			for i := 0; i < len(allSubAccounts); i++ {
				allAccountIds = append(allAccountIds, allSubAccounts[i].AccountId)
			}
		} else {
			allAccountIds = append(allAccountIds, accountId)
		}
	}

	return allAccountIds, nil
}

func (a *TransactionsApi) getCategoryOrSubCategoryIds(c *core.Context, categoryId int64, uid int64) ([]int64, error) {
	var allCategoryIds []int64

	if categoryId > 0 {
		allSubCategories, err := a.transactionCategories.GetAllCategoriesByUid(c, uid, 0, categoryId)

		if err != nil {
			return nil, err
		}

		if len(allSubCategories) > 0 {
			for i := 0; i < len(allSubCategories); i++ {
				allCategoryIds = append(allCategoryIds, allSubCategories[i].CategoryId)
			}
		} else {
			allCategoryIds = append(allCategoryIds, categoryId)
		}
	}

	return allCategoryIds, nil
}

func (a *TransactionsApi) getTransactionTagIds(allTransactionTagIds map[int64][]int64) []int64 {
	allTagIds := make([]int64, 0, len(allTransactionTagIds))

	for _, tagIds := range allTransactionTagIds {
		allTagIds = append(allTagIds, tagIds...)
	}

	return allTagIds
}

func (a *TransactionsApi) getTransactionTagInfoResponses(tagIds []int64, allTransactionTags map[int64]*models.TransactionTag) []*models.TransactionTagInfoResponse {
	allTags := make([]*models.TransactionTagInfoResponse, 0, len(tagIds))

	for i := 0; i < len(tagIds); i++ {
		tag := allTransactionTags[tagIds[i]]

		if tag == nil {
			continue
		}

		allTags = append(allTags, tag.ToTransactionTagInfoResponse())
	}

	return allTags
}

func (a *TransactionsApi) getTransactionListResult(c *core.Context, user *models.User, transactions []*models.Transaction, utcOffset int16, trimAccount bool, trimCategory bool, trimTag bool) (models.TransactionInfoResponseSlice, error) {
	uid := user.Uid
	transactionIds := make([]int64, len(transactions))
	accountIds := make([]int64, 0, len(transactions)*2)
	categoryIds := make([]int64, 0, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transactionId := transactions[i].TransactionId

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transactionId = transactions[i].RelatedId
		}

		transactionIds[i] = transactionId
		accountIds = append(accountIds, transactions[i].AccountId)

		if transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN || transactions[i].Type == models.TRANSACTION_DB_TYPE_TRANSFER_OUT {
			accountIds = append(accountIds, transactions[i].RelatedAccountId)
		}

		categoryIds = append(categoryIds, transactions[i].CategoryId)
	}

	allAccounts, err := a.accounts.GetAccountsByAccountIds(c, uid, utils.ToUniqueInt64Slice(accountIds))

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.getTransactionListResult] failed to get accounts for user \"uid:%d\", because %s", uid, err.Error())
		return nil, err
	}

	transactions = a.filterTransactions(c, uid, transactions, allAccounts)

	allTransactionTagIds, err := a.transactionTags.GetAllTagIdsOfTransactions(c, uid, transactionIds)

	if err != nil {
		log.ErrorfWithRequestId(c, "[transactions.getTransactionListResult] failed to get transactions tag ids for user \"uid:%d\", because %s", uid, err.Error())
		return nil, err
	}

	var categoryMap map[int64]*models.TransactionCategory
	var tagMap map[int64]*models.TransactionTag

	if !trimCategory {
		categoryMap, err = a.transactionCategories.GetCategoriesByCategoryIds(c, uid, utils.ToUniqueInt64Slice(categoryIds))

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.getTransactionListResult] failed to get transactions categories for user \"uid:%d\", because %s", uid, err.Error())
			return nil, err
		}
	}

	if !trimTag {
		tagMap, err = a.transactionTags.GetTagsByTagIds(c, uid, utils.ToUniqueInt64Slice(a.getTransactionTagIds(allTransactionTagIds)))

		if err != nil {
			log.ErrorfWithRequestId(c, "[transactions.getTransactionListResult] failed to get transactions tags for user \"uid:%d\", because %s", uid, err.Error())
			return nil, err
		}
	}

	result := make(models.TransactionInfoResponseSlice, len(transactions))

	for i := 0; i < len(transactions); i++ {
		transaction := transactions[i]

		if transaction.Type == models.TRANSACTION_DB_TYPE_TRANSFER_IN {
			transaction = a.transactions.GetRelatedTransferTransaction(transaction)
		}

		transactionEditable := transaction.IsEditable(user, utcOffset, allAccounts[transaction.AccountId], allAccounts[transaction.RelatedAccountId])
		transactionTagIds := allTransactionTagIds[transaction.TransactionId]
		result[i] = transaction.ToTransactionInfoResponse(transactionTagIds, transactionEditable)

		if !trimAccount {
			if sourceAccount := allAccounts[transaction.AccountId]; sourceAccount != nil {
				result[i].SourceAccount = sourceAccount.ToAccountInfoResponse()
			}

			if destinationAccount := allAccounts[transaction.RelatedAccountId]; destinationAccount != nil {
				result[i].DestinationAccount = destinationAccount.ToAccountInfoResponse()
			}
		}

		if !trimCategory {
			if category := categoryMap[transaction.CategoryId]; category != nil {
				result[i].Category = category.ToTransactionCategoryInfoResponse()
			}
		}

		if !trimTag {
			result[i].Tags = a.getTransactionTagInfoResponses(transactionTagIds, tagMap)
		}
	}

	sort.Sort(result)

	return result, nil
}

func (a *TransactionsApi) createNewTransactionModel(uid int64, transactionCreateReq *models.TransactionCreateRequest, clientIp string) *models.Transaction {
	var transactionDbType models.TransactionDbType

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_MODIFY_BALANCE {
		transactionDbType = models.TRANSACTION_DB_TYPE_MODIFY_BALANCE
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_EXPENSE {
		transactionDbType = models.TRANSACTION_DB_TYPE_EXPENSE
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_INCOME {
		transactionDbType = models.TRANSACTION_DB_TYPE_INCOME
	} else if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER {
		transactionDbType = models.TRANSACTION_DB_TYPE_TRANSFER_OUT
	}

	transaction := &models.Transaction{
		Uid:               uid,
		Type:              transactionDbType,
		CategoryId:        transactionCreateReq.CategoryId,
		TransactionTime:   utils.GetMinTransactionTimeFromUnixTime(transactionCreateReq.Time),
		TimezoneUtcOffset: transactionCreateReq.UtcOffset,
		AccountId:         transactionCreateReq.SourceAccountId,
		Amount:            transactionCreateReq.SourceAmount,
		HideAmount:        transactionCreateReq.HideAmount,
		Comment:           transactionCreateReq.Comment,
		CreatedIp:         clientIp,
	}

	if transactionCreateReq.Type == models.TRANSACTION_TYPE_TRANSFER {
		transaction.RelatedAccountId = transactionCreateReq.DestinationAccountId
		transaction.RelatedAccountAmount = transactionCreateReq.DestinationAmount
	}

	if transactionCreateReq.GeoLocation != nil {
		transaction.GeoLongitude = transactionCreateReq.GeoLocation.Longitude
		transaction.GeoLatitude = transactionCreateReq.GeoLocation.Latitude
	}

	return transaction
}
