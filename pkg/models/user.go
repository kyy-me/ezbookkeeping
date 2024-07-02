package models

import (
	"fmt"
	"time"

	"github.com/kyy-me/ezbookkeeping/pkg/settings"
	"github.com/kyy-me/ezbookkeeping/pkg/utils"
)

// TransactionEditScope represents the scope which transaction can be edited
type TransactionEditScope byte

// Editable Transaction Ranges
const (
	TRANSACTION_EDIT_SCOPE_NONE                TransactionEditScope = 0
	TRANSACTION_EDIT_SCOPE_ALL                 TransactionEditScope = 1
	TRANSACTION_EDIT_SCOPE_TODAY_OR_LATER      TransactionEditScope = 2
	TRANSACTION_EDIT_SCOPE_LAST_24H_OR_LATER   TransactionEditScope = 3
	TRANSACTION_EDIT_SCOPE_THIS_WEEK_OR_LATER  TransactionEditScope = 4
	TRANSACTION_EDIT_SCOPE_THIS_MONTH_OR_LATER TransactionEditScope = 5
	TRANSACTION_EDIT_SCOPE_THIS_YEAR_OR_LATER  TransactionEditScope = 6
	TRANSACTION_EDIT_SCOPE_INVALID             TransactionEditScope = 255
)

// String returns a textual representation of the editable transaction ranges enum
func (s TransactionEditScope) String() string {
	switch s {
	case TRANSACTION_EDIT_SCOPE_NONE:
		return "None"
	case TRANSACTION_EDIT_SCOPE_ALL:
		return "All"
	case TRANSACTION_EDIT_SCOPE_TODAY_OR_LATER:
		return "TodayOrLater"
	case TRANSACTION_EDIT_SCOPE_LAST_24H_OR_LATER:
		return "Last24HourOrLater"
	case TRANSACTION_EDIT_SCOPE_THIS_WEEK_OR_LATER:
		return "ThisWeekOrLater"
	case TRANSACTION_EDIT_SCOPE_THIS_MONTH_OR_LATER:
		return "ThisMonthOrLater"
	case TRANSACTION_EDIT_SCOPE_THIS_YEAR_OR_LATER:
		return "ThisYearOrLater"
	case TRANSACTION_EDIT_SCOPE_INVALID:
		return "Invalid"
	default:
		return fmt.Sprintf("Invalid(%d)", int(s))
	}
}

// User represents user data stored in database
type User struct {
	Uid                  int64  `xorm:"PK"`
	Username             string `xorm:"VARCHAR(32) UNIQUE NOT NULL"`
	Email                string `xorm:"VARCHAR(100) UNIQUE NOT NULL"`
	Nickname             string `xorm:"VARCHAR(64) NOT NULL"`
	Password             string `xorm:"VARCHAR(64) NOT NULL"`
	Salt                 string `xorm:"VARCHAR(10) NOT NULL"`
	DefaultAccountId     int64
	TransactionEditScope TransactionEditScope `xorm:"TINYINT NOT NULL"`
	Language             string               `xorm:"VARCHAR(10)"`
	DefaultCurrency      string               `xorm:"VARCHAR(3) NOT NULL"`
	FirstDayOfWeek       WeekDay              `xorm:"TINYINT NOT NULL"`
	LongDateFormat       LongDateFormat       `xorm:"TINYINT"`
	ShortDateFormat      ShortDateFormat      `xorm:"TINYINT"`
	LongTimeFormat       LongTimeFormat       `xorm:"TINYINT"`
	ShortTimeFormat      ShortTimeFormat      `xorm:"TINYINT"`
	DecimalSeparator     DecimalSeparator     `xorm:"TINYINT"`
	DigitGroupingSymbol  DigitGroupingSymbol  `xorm:"TINYINT"`
	DigitGrouping        DigitGroupingType    `xorm:"TINYINT"`
	CurrencyDisplayType  CurrencyDisplayType  `xorm:"TINYINT"`
	Disabled             bool
	Deleted              bool `xorm:"NOT NULL"`
	EmailVerified        bool `xorm:"NOT NULL"`
	CreatedUnixTime      int64
	UpdatedUnixTime      int64
	DeletedUnixTime      int64
	LastLoginUnixTime    int64
}

// UserBasicInfo represents a view-object of user basic info
type UserBasicInfo struct {
	Username             string               `json:"username"`
	Email                string               `json:"email"`
	Nickname             string               `json:"nickname"`
	AvatarUrl            string               `json:"avatar"`
	AvatarProvider       string               `json:"avatarProvider,omitempty"`
	DefaultAccountId     int64                `json:"defaultAccountId,string"`
	TransactionEditScope TransactionEditScope `json:"transactionEditScope"`
	Language             string               `json:"language"`
	DefaultCurrency      string               `json:"defaultCurrency"`
	FirstDayOfWeek       WeekDay              `json:"firstDayOfWeek"`
	LongDateFormat       LongDateFormat       `json:"longDateFormat"`
	ShortDateFormat      ShortDateFormat      `json:"shortDateFormat"`
	LongTimeFormat       LongTimeFormat       `json:"longTimeFormat"`
	ShortTimeFormat      ShortTimeFormat      `json:"shortTimeFormat"`
	DecimalSeparator     DecimalSeparator     `json:"decimalSeparator"`
	DigitGroupingSymbol  DigitGroupingSymbol  `json:"digitGroupingSymbol"`
	DigitGrouping        DigitGroupingType    `json:"digitGrouping"`
	CurrencyDisplayType  CurrencyDisplayType  `json:"currencyDisplayType"`
	EmailVerified        bool                 `json:"emailVerified"`
}

// UserLoginRequest represents all parameters of user login request
type UserLoginRequest struct {
	LoginName string `json:"loginName" binding:"required,notBlank,max=100,validUsername|validEmail"`
	Password  string `json:"password" binding:"required,min=6,max=128"`
}

// UserRegisterRequest represents all parameters of user registering request
type UserRegisterRequest struct {
	Username        string  `json:"username" binding:"required,notBlank,max=32,validUsername"`
	Email           string  `json:"email" binding:"required,notBlank,max=100,validEmail"`
	Nickname        string  `json:"nickname" binding:"required,notBlank,max=64"`
	Password        string  `json:"password" binding:"required,min=6,max=128"`
	Language        string  `json:"language" binding:"required,min=2,max=16"`
	DefaultCurrency string  `json:"defaultCurrency" binding:"required,len=3,validCurrency"`
	FirstDayOfWeek  WeekDay `json:"firstDayOfWeek" binding:"min=0,max=6"`
	TransactionCategoryCreateBatchRequest
}

// UserVerifyEmailRequest represents all parameters of user verify email request
type UserVerifyEmailRequest struct {
	RequestNewToken bool `json:"requestNewToken" binding:"omitempty"`
}

// UserVerifyEmailResponse represents all response parameters after user have verified email
type UserVerifyEmailResponse struct {
	NewToken string         `json:"newToken,omitempty"`
	User     *UserBasicInfo `json:"user"`
}

// UserResendVerifyEmailRequest represents all parameters of user resend verify email request
type UserResendVerifyEmailRequest struct {
	Email    string `json:"email" binding:"omitempty,max=100,validEmail"`
	Password string `json:"password" binding:"omitempty,min=6,max=128"`
}

// UserProfileUpdateRequest represents all parameters of user updating profile request
type UserProfileUpdateRequest struct {
	Email                string                `json:"email" binding:"omitempty,notBlank,max=100,validEmail"`
	Nickname             string                `json:"nickname" binding:"omitempty,notBlank,max=64"`
	Password             string                `json:"password" binding:"omitempty,min=6,max=128"`
	OldPassword          string                `json:"oldPassword" binding:"omitempty,min=6,max=128"`
	DefaultAccountId     int64                 `json:"defaultAccountId,string" binding:"omitempty,min=1"`
	TransactionEditScope *TransactionEditScope `json:"transactionEditScope" binding:"omitempty,min=0,max=7"`
	Language             string                `json:"language" binding:"omitempty,min=2,max=16"`
	DefaultCurrency      string                `json:"defaultCurrency" binding:"omitempty,len=3,validCurrency"`
	FirstDayOfWeek       *WeekDay              `json:"firstDayOfWeek" binding:"omitempty,min=0,max=6"`
	LongDateFormat       *LongDateFormat       `json:"longDateFormat" binding:"omitempty,min=0,max=3"`
	ShortDateFormat      *ShortDateFormat      `json:"shortDateFormat" binding:"omitempty,min=0,max=3"`
	LongTimeFormat       *LongTimeFormat       `json:"longTimeFormat" binding:"omitempty,min=0,max=3"`
	ShortTimeFormat      *ShortTimeFormat      `json:"shortTimeFormat" binding:"omitempty,min=0,max=3"`
	DecimalSeparator     *DecimalSeparator     `json:"decimalSeparator" binding:"omitempty,min=0,max=3"`
	DigitGroupingSymbol  *DigitGroupingSymbol  `json:"digitGroupingSymbol" binding:"omitempty,min=0,max=4"`
	DigitGrouping        *DigitGroupingType    `json:"digitGrouping" binding:"omitempty,min=0,max=2"`
	CurrencyDisplayType  *CurrencyDisplayType  `json:"currencyDisplayType" binding:"omitempty,min=0,max=9"`
}

// UserProfileUpdateResponse represents the data returns to frontend after updating profile
type UserProfileUpdateResponse struct {
	User     *UserBasicInfo `json:"user"`
	NewToken string         `json:"newToken,omitempty"`
}

// UserProfileResponse represents a view-object of user profile
type UserProfileResponse struct {
	Username             string               `json:"username"`
	Email                string               `json:"email"`
	Nickname             string               `json:"nickname"`
	AvatarUrl            string               `json:"avatar"`
	AvatarProvider       string               `json:"avatarProvider,omitempty"`
	DefaultAccountId     int64                `json:"defaultAccountId,string"`
	TransactionEditScope TransactionEditScope `json:"transactionEditScope"`
	Language             string               `json:"language"`
	DefaultCurrency      string               `json:"defaultCurrency"`
	FirstDayOfWeek       WeekDay              `json:"firstDayOfWeek"`
	LongDateFormat       LongDateFormat       `json:"longDateFormat"`
	ShortDateFormat      ShortDateFormat      `json:"shortDateFormat"`
	LongTimeFormat       LongTimeFormat       `json:"longTimeFormat"`
	ShortTimeFormat      ShortTimeFormat      `json:"shortTimeFormat"`
	DecimalSeparator     DecimalSeparator     `json:"decimalSeparator"`
	DigitGroupingSymbol  DigitGroupingSymbol  `json:"digitGroupingSymbol"`
	DigitGrouping        DigitGroupingType    `json:"digitGrouping"`
	CurrencyDisplayType  CurrencyDisplayType  `json:"currencyDisplayType"`
	EmailVerified        bool                 `json:"emailVerified"`
	LastLoginAt          int64                `json:"lastLoginAt"`
}

// CanEditTransactionByTransactionTime returns whether this user can edit transaction with specified transaction time
func (u *User) CanEditTransactionByTransactionTime(transactionTime int64, utcOffset int16) bool {
	if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_NONE {
		return false
	} else if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_ALL {
		return true
	}

	now := time.Now()

	transactionUnixTime := utils.GetUnixTimeFromTransactionTime(transactionTime)

	if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_LAST_24H_OR_LATER {
		return transactionUnixTime >= now.Unix()-24*60*60
	}

	clientLocation := time.FixedZone("Client Timezone", int(utcOffset)*60)
	clientNow := now.In(clientLocation)
	clientTodayFirstUnixTime := clientNow.Unix() - int64(clientNow.Hour()*60*60+clientNow.Minute()*60+clientNow.Second())

	if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_TODAY_OR_LATER {
		return transactionUnixTime >= clientTodayFirstUnixTime
	} else if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_THIS_WEEK_OR_LATER {
		dayOfWeek := int(now.Weekday()) - int(u.FirstDayOfWeek)

		if dayOfWeek < 0 {
			dayOfWeek += 7
		}

		clientWeekFirstUnixTime := clientTodayFirstUnixTime - int64(dayOfWeek*24*60*60)
		return transactionUnixTime >= clientWeekFirstUnixTime
	} else if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_THIS_MONTH_OR_LATER {
		clientMonthFirstUnixTime := clientTodayFirstUnixTime - int64((now.Day()-1)*24*60*60)
		return transactionUnixTime >= clientMonthFirstUnixTime
	} else if u.TransactionEditScope == TRANSACTION_EDIT_SCOPE_THIS_YEAR_OR_LATER {
		clientYearFirstUnixTime := clientTodayFirstUnixTime - int64((now.YearDay()-1)*24*60*60)
		return transactionUnixTime >= clientYearFirstUnixTime
	}

	return false
}

// ToUserBasicInfo returns a user basic view-object according to database model
func (u *User) ToUserBasicInfo() *UserBasicInfo {
	return &UserBasicInfo{
		Username:             u.Username,
		Email:                u.Email,
		Nickname:             u.Nickname,
		AvatarUrl:            u.getAvatarUrl(),
		AvatarProvider:       u.getAvatarProvider(),
		DefaultAccountId:     u.DefaultAccountId,
		TransactionEditScope: u.TransactionEditScope,
		Language:             u.Language,
		DefaultCurrency:      u.DefaultCurrency,
		FirstDayOfWeek:       u.FirstDayOfWeek,
		LongDateFormat:       u.LongDateFormat,
		ShortDateFormat:      u.ShortDateFormat,
		LongTimeFormat:       u.LongTimeFormat,
		ShortTimeFormat:      u.ShortTimeFormat,
		DecimalSeparator:     u.DecimalSeparator,
		DigitGroupingSymbol:  u.DigitGroupingSymbol,
		DigitGrouping:        u.DigitGrouping,
		CurrencyDisplayType:  u.CurrencyDisplayType,
		EmailVerified:        u.EmailVerified,
	}
}

// ToUserProfileResponse returns a user profile view-object according to database model
func (u *User) ToUserProfileResponse() *UserProfileResponse {
	return &UserProfileResponse{
		Username:             u.Username,
		Email:                u.Email,
		Nickname:             u.Nickname,
		AvatarUrl:            u.getAvatarUrl(),
		AvatarProvider:       u.getAvatarProvider(),
		DefaultAccountId:     u.DefaultAccountId,
		TransactionEditScope: u.TransactionEditScope,
		Language:             u.Language,
		DefaultCurrency:      u.DefaultCurrency,
		FirstDayOfWeek:       u.FirstDayOfWeek,
		LongDateFormat:       u.LongDateFormat,
		ShortDateFormat:      u.ShortDateFormat,
		LongTimeFormat:       u.LongTimeFormat,
		ShortTimeFormat:      u.ShortTimeFormat,
		DecimalSeparator:     u.DecimalSeparator,
		DigitGroupingSymbol:  u.DigitGroupingSymbol,
		DigitGrouping:        u.DigitGrouping,
		CurrencyDisplayType:  u.CurrencyDisplayType,
		EmailVerified:        u.EmailVerified,
		LastLoginAt:          u.LastLoginUnixTime,
	}
}

func (u *User) getAvatarProvider() string {
	return settings.Container.Current.AvatarProvider
}

func (u *User) getAvatarUrl() string {
	avatarProvider := settings.Container.Current.AvatarProvider

	if avatarProvider == settings.GravatarProvider {
		return utils.GetGravatarUrl(u.Email)
	}

	return ""
}
